use std::ffi::OsStr;
use std::fs::{self, File};
use std::io::{Write, Read, copy};

use zip::ZipArchive;
use dirs::data_local_dir;

const HOSTS_ENTRIES: &str = "\
# Fluster Local Domain Entries
127.0.0.1 fluster.is
127.0.0.1 www.fluster.is
";

fn write_hosts_file() -> Result<String, String> {
    let hosts_path = match std::env::consts::OS {
        "windows" => r"C:\Windows\System32\drivers\etc\hosts",
        _ => "/etc/hosts",
    };

    if !std::path::Path::new(hosts_path).exists() {
        return Err(format!("Hosts file not found at {}", hosts_path));
    }

    let mut file = std::fs::OpenOptions::new()
        .append(true)
        .open(hosts_path)
        .map_err(|e| format!("Failed to open hosts file: {}", e))?;

    file.write_all(HOSTS_ENTRIES.as_bytes())
        .map_err(|e| format!("Failed to write to hosts file: {}", e))?;

    Ok("Hosts file updated successfully".to_string())
}

#[tauri::command]
fn get_device_username() -> String {
    let username = std::env::var("USER").unwrap_or_else(|_| "Unknown".to_string());

    if username == "Unknown" && cfg!(target_os = "windows") {
        extern "C" {
            fn GetUserNameA(lpbuffer: *mut u8, nsize: *mut u32) -> i32;
        }

        let mut buffer: [u8; 256] = [0; 256];
        let mut size: u32 = buffer.len() as u32;

        let result = unsafe { GetUserNameA(buffer.as_mut_ptr(), &mut size) };

        if result == 0 {
            return "Unknown".to_string();
        }

        return String::from_utf8_lossy(&buffer[..size as usize - 1]).to_string();
    }
    
    return username;
}

#[tauri::command]
fn is_version_installed(version: &str) -> bool {
    let data = match data_local_dir() {
        Some(path) => path,
        None => return false,
    };

    let client_folder = data.join("Fluster").join("versions").join(version);
    let client_folder_path = std::path::Path::new(&client_folder);
    
    if client_folder_path.exists() == false {
        return false;
    }

    let client = client_folder_path.join("Roblox.exe");
    let client_path = std::path::Path::new(&client);

    return client_folder_path.exists() && client_path.exists() && client_path.is_file() && client_folder_path.is_dir();
}

#[tauri::command]
async fn launch_client(version: String) -> bool {
    let data = match data_local_dir() {
        Some(path) => path,
        None => return false,
    };

    let whats_path = data.join("Fluster").join("versions").join(version).join("Roblox.exe");
    let client = std::path::Path::new(&whats_path);

    if client.exists() == false {
        return false;
    }

    std::process::Command::new(client)
        .spawn()
        .expect("Failed to launch the client");

    return true;
}

#[tauri::command]
fn is_fluster_setup() -> bool {
    let data = match data_local_dir() {
        Some(path) => path,
        None => return false,
    };

    let fluster_path = data.join("Fluster");
    return fluster_path.exists() && fluster_path.is_dir();
}

#[tauri::command]   
fn fluster_setup() -> bool {
    let data = match data_local_dir() {
        Some(path) => path,
        None => return false,
    };

    let fluster_path = data.join("Fluster");
    let versions_path = fluster_path.join("versions");
    let downloads_path = fluster_path.join("downloads");

    if fluster_path.exists() == false && fluster_path.is_dir() == false {
        std::fs::create_dir_all(&fluster_path).expect("Failed to create Fluster directory");
        std::fs::create_dir_all(&versions_path).expect("Failed to create Fluster/versions directory");
        std::fs::create_dir_all(&downloads_path).expect("Failed to create Fluster/downloads directory");

        return true;
    }

    return false;
}

#[tauri::command]
async fn install_client(version: &str) -> Result<String, String> {
    let data = match data_local_dir() {
        Some(path) => path,
        None => return Err("Failed to get data local directory".to_string()),
    };

    let version_path = data.join("Fluster").join("versions").join(version);
    let downloads_dir = data.join("Fluster").join("downloads");

    fs::create_dir_all(&downloads_dir)
        .map_err(|e| format!("Creating the Fluster Downloads directory failed: {}", e))?;


    let url = format!("https://cdn.simuldev.com/{}.zip", version);
    let dest_zip = downloads_dir.join(format!("{}", version));
    
    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to contact with Fluster Storage servers: {}", e))?;

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(format!("{} was not available on our servers", version));
    }

    if response.status() != reqwest::StatusCode::OK || response.content_length().is_none() {
        return Err(format!("Failed to download {} for error code {}", version, response.status()));
    }

    let content = response.bytes()
        .await
        .map_err(|e| format!("Failed to read the response body: {}", e))?;

    File::create(dest_zip)
        .map_err(|e| format!("Failed to create the destination file: {}", e))?
        .write_all(&content)
        .map_err(|e| format!("Failed to write the verison data to the file: {}", e))?;

    let file = File::open(downloads_dir.join(format!("{}", version)))
        .map_err(|e| format!("Failed to open the zip file: {}", e))?;

    let mut archive = ZipArchive::new(file)
        .map_err(|e| format!("Failed to create the zip archive: {}", e))?;

    for i in 0 .. archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read the zip entry: {}", e))?;

        let out_path = version_path.join(entry.name().to_string());

        if entry.is_dir() {
            fs::create_dir_all(&out_path)
                .map_err(|e| format!("Failed to create the directory: {}", e))?;
        } else {
            if let Some(p) = out_path.parent() {
                fs::create_dir_all(p)
                    .map_err(|e| format!("Failed to create the parent directory: {}", e))?;
            }

            copy(
                &mut entry,
                &mut File::create(&out_path)
                    .map_err(|e| format!("Failed to create the file: {}", e))?,
            ).map_err(|e| format!("Failed to write the file: {}", e))?;
        }
    }

    Ok(format!("{} installed successfully", version))

}

#[tauri::command]
async fn setup_hosts_file() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        use winapi::um::{ shellapi::ShellExecuteW, winuser::SW_HIDE };

        // lets read before hand if the hosts file is already set up
        let hosts_path = match std::env::consts::OS {
            "windows" => r"C:\Windows\System32\drivers\etc\hosts",
            _ => "/etc/hosts",
        };

        if !std::path::Path::new(hosts_path).exists() {
            return Err(format!("Hosts file not found at {}", hosts_path));
        }

        let mut file = std::fs::OpenOptions::new()
            .read(true)
            .open(hosts_path)
            .map_err(|e| format!("Failed to open hosts file: {}", e))?;

        if file.metadata().is_ok() {
            let mut contents = String::new();
            
            file.read_to_string(&mut contents)
                .map_err(|e| format!("Failed to read hosts file: {}", e))?;

            if contents.contains(HOSTS_ENTRIES) {
                return Ok("Hosts file already contains Fluster entries".to_string());
            }
        }

        // ok nvm it doesn't exist.. let's add them
        fn to_wide(s: &str) -> Vec<u16> {
            OsStr::new(s).encode_wide().chain(Some(0)).collect()
        }

        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_w = to_wide(&exe.to_string_lossy());
        let verb = to_wide("runas");
        let args = to_wide("--write-hosts");

        let result = unsafe {
            ShellExecuteW(
                std::ptr::null_mut(),
                verb.as_ptr(),
                exe_w.as_ptr(),
                args.as_ptr(),
                std::ptr::null(),
                SW_HIDE,
            )
        };

        if (result as isize) <= 32 {
            Err("We couldn't add the local Fluster Domains onto your machine, did you accept the UAC prompt?".into())
        } else {
            Ok("Setup the local Fluster Domains onto the machine!".into())
        }
    }
}

#[tauri::command]
async fn uninstall_client(version: &str) -> Result<String, String> {
    let data = match data_local_dir() {
        Some(path) => path,
        None => return Err("Failed to get data local directory".to_string()),
    };

    let version_path = data.join("Fluster").join("versions").join(version);

    if version_path.exists() == false {
        return Err(format!("{} is not installed", version));
    }

    fs::remove_dir_all(&version_path)
        .map_err(|e| format!("Failed to remove the version directory for {}", e))?;

    Ok(format!("{} was uninstalled from the device", version))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // UGLY HACK: editing the hosts file requires admin perms
    // so scratching my head for ideas, i just straight up decided to
    // create a new process with elevated permissions to do it for me with some args n thats it

    if std::env::args().any(|arg| arg == "--write-hosts") {
        match write_hosts_file() {
            Ok(_) => std::process::exit(0),
            Err(_) => std::process::exit(1),
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        
        .invoke_handler(tauri::generate_handler![
            get_device_username,
        
            fluster_setup,
            setup_hosts_file,
            
            is_fluster_setup,
            is_version_installed,

            launch_client,
            install_client,
            uninstall_client,
        ])
        
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
