use std::{fs::{self, File}, io::{copy, Write}};

use zip::ZipArchive;
use dirs::data_local_dir;

#[tauri::command]
fn get_device_username() -> String {
    let username = std::env::var("USER").unwrap_or_else(|_| "Unknown".to_string());
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

    // launch the executable on windows
    let mut command = std::process::Command::new(client);

    command
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
        std::fs::create_dir_all(&versions_path).expect("Failed to create versions directory");
        std::fs::create_dir_all(&downloads_path).expect("Failed to create downloads directory");

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
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        
        .invoke_handler(tauri::generate_handler![
            get_device_username,
        
            fluster_setup,
            is_fluster_setup,
            is_version_installed,

            launch_client,
            install_client,
            uninstall_client,
        ])
        
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
