use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs::{self, File};
use std::io::{copy, Write};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter};
use zip::ZipArchive;

mod routes;
mod utils;

use routes::*;

#[derive(Debug, Serialize, Deserialize)]
struct VersionStats {
    total_play_time: u64,
    last_played: u64,
    is_running: bool,
    start_time: Option<u64>,
    size_bytes: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct VersionsData {
    versions: HashMap<String, VersionStats>,
}

impl Default for VersionsData {
    fn default() -> Self {
        VersionsData {
            versions: HashMap::new(),
        }
    }
}

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
fn start_listening(app: AppHandle) -> Result<(), String> {
    let client_result = utils::network::lan_discovery::start_discovery()
        .map_err(|e| format!("Failed to start the discovery: {}", e));

    std::thread::spawn(move || {
        if let Ok(client) = client_result {
            while let Ok((addr, server_info)) = client.receiver.recv() {
                let discovery_info = serde_json::json!({
                    "host": addr.ip().to_string(),
                    "port": addr.port(),
                    "version": server_info.version
                });

                app.emit("discovery", discovery_info.to_string())
                    .unwrap_or_else(|e| eprintln!("Failed to emit discovery event: {}", e));
            }
        } else {
            eprintln!("Failed to start the discovery");
        }
    });

    Ok(())
}

#[tauri::command]
fn start_server(version: &str, file_path: &str) -> Result<(), String> {
    let port = rand::random::<u16>() % 65535 + 1;

    let data = match utils::appdata::return_versions() {
        Ok(path) => path,
        Err(_) => return Err("Failed to get the versions directory.".to_string()),
    };

    if !utils::client::is_client_installed(version) {
        return Err("Client is not installed.".to_string());
    }

    let game_file_path = std::path::Path::new(file_path);

    if !game_file_path.exists() || !game_file_path.is_file() {
        return Err("Game file does not exist.".to_string());
    }

    let server_discovery_message = utils::network::lan_discovery::start_server(port, version)
        .map_err(|e| format!("Failed to start the server: {}", e))?;

    let mut server_launch = std::process::Command::new(data.join(version).join("Roblox.exe"))
        .arg(file_path)
        .arg("-no3d")
        .arg("-script")
        .arg(format!(
            "loadfile('http://www.fluster.is/game/gameserver.ashx')(0, {})",
            port.to_string()
        ))
        .spawn()
        .map_err(|_| "Failed to launch the server.".to_string())?;

    std::thread::spawn(move || {
        let _ = server_launch.wait();
        server_discovery_message.stop();
    });

    Ok(())
}

#[tauri::command]
fn launch_server_connection(
    version: &str,
    server_ip: &str,
    server_port: u16,
    user_id: usize,
) -> Result<bool, String> {
    let data = match utils::appdata::return_versions() {
        Ok(path) => path,
        Err(_) => return Err("Failed to get the versions directory.".to_string()),
    };

    if !utils::client::is_client_installed(version) {
        return Err("Client is not installed.".to_string());
    }

    let client_path = data.join(version).join("Roblox.exe");

    let result = std::process::Command::new(client_path)
        .arg("-script")
        .arg(format!(
            "http://www.fluster.is/game/join.ashx?UserID={}&serverPort={}&serverIP={}",
            user_id, server_port, server_ip
        ))
        .spawn();

    match result {
        Ok(_) => {
            let version_owned = version.to_string();
            update_version_stats(&version_owned, true);

            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_secs(2));

                loop {
                    std::thread::sleep(std::time::Duration::from_secs(5));

                    let process_name = if cfg!(target_os = "windows") {
                        "Roblox.exe"
                    } else {
                        "Roblox"
                    };

                    let output = std::process::Command::new("ps").arg("aux").output();

                    match output {
                        Ok(output) => {
                            let processes = String::from_utf8_lossy(&output.stdout);
                            if !processes.contains(process_name) {
                                update_version_stats(&version_owned, false);
                                break;
                            }
                        }
                        Err(_) => {
                            update_version_stats(&version_owned, false);
                            break;
                        }
                    }
                }
            });
            Ok(true)
        }
        Err(_) => Err("Failed to launch the client.".to_string()),
    }
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
    return utils::client::is_client_installed(version);
}

#[tauri::command]
fn launch_client(version: &str) -> Result<bool, String> {
    let result = utils::client::launch_client(version);
    if result.is_ok() {
        let version_owned = version.to_string();
        update_version_stats(&version_owned, true);

        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_secs(2));
            loop {
                std::thread::sleep(std::time::Duration::from_secs(5));

                let process_name = if cfg!(target_os = "windows") {
                    "Roblox.exe"
                } else {
                    "Roblox"
                };

                let output = std::process::Command::new("ps").arg("aux").output();

                match output {
                    Ok(output) => {
                        let processes = String::from_utf8_lossy(&output.stdout);
                        if !processes.contains(process_name) {
                            update_version_stats(&version_owned, false);
                            break;
                        }
                    }
                    Err(_) => {
                        update_version_stats(&version_owned, false);
                        break;
                    }
                }
            }
        });
    }
    result
}

#[tauri::command]
fn is_fluster_setup() -> bool {
    return utils::appdata::is_fluster_setup();
}

#[tauri::command]
fn fluster_setup() -> Result<bool, String> {
    utils::appdata::return_versions().ok();

    utils::appdata::return_downloads().ok();

    utils::appdata::return_cache().ok();

    return Ok(true);
}

#[tauri::command]
async fn install_client(version: &str) -> Result<bool, String> {
    println!("starting installation for version: {}", version);

    let versions = match utils::appdata::return_versions() {
        Ok(path) => {
            println!("versions directory: {:?}", path);
            path
        }
        Err(e) => return Err(format!("Failed to get the versions directory: {}", e)),
    };

    let downloads = match utils::appdata::return_downloads() {
        Ok(path) => {
            println!("downloads directory: {:?}", path);
            path
        }
        Err(e) => return Err(format!("Failed to get the downloads directory: {}", e)),
    };

    if utils::client::is_client_installed(version) {
        println!("version {} is already installed", version);
        return Ok(true);
    }

    let url = format!("https://cdn.simuldev.com/{}.zip", version);
    println!("downloading from url: {}", url);
    let dest_zip = downloads.join(version);
    println!("download destination: {:?}", dest_zip);

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("Failed to contact with the Fluster Storage: {}", e))?;

    println!("download response status: {}", response.status());

    if response.status() == reqwest::StatusCode::NOT_FOUND {
        return Err(format!(
            "{} was not available on the Fluster Storage",
            version
        ));
    }

    if response.status() != reqwest::StatusCode::OK || response.content_length().is_none() {
        return Err(format!(
            "Failed to download {} for error code {}",
            version,
            response.status()
        ));
    }

    println!("content length: {:?}", response.content_length());

    let content = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read the response body: {}", e))?;

    println!("downloaded content size: {} bytes", content.len());

    File::create(&dest_zip)
        .map_err(|e| format!("Failed to create the destination file: {}", e))?
        .write_all(&content)
        .map_err(|e| format!("Failed to write the version data to the file: {}", e))?;

    println!("successfully wrote zip file to: {:?}", dest_zip);

    let file = File::open(&dest_zip).map_err(|e| format!("Failed to open the zip file: {}", e))?;

    let mut archive =
        ZipArchive::new(file).map_err(|e| format!("Failed to create the zip archive: {}", e))?;

    println!(
        "successfully opened zip archive with {} files",
        archive.len()
    );

    let version_path = versions.join(version);
    println!("target installation path: {:?}", version_path);

    if !version_path.exists() {
        println!("creating version directory");
        fs::create_dir_all(&version_path)
            .map_err(|e| format!("Failed to create version directory: {}", e))?;
    }

    for i in 0..archive.len() {
        let mut entry = archive
            .by_index(i)
            .map_err(|e| format!("Failed to read the zip entry: {}", e))?;

        let out_path = version_path.join(entry.name());
        println!("extracting: {} to {:?}", entry.name(), out_path);

        if entry.is_dir() {
            fs::create_dir_all(&out_path)
                .map_err(|e| format!("Failed to create the directory: {}", e))?;
        } else {
            if let Some(p) = out_path.parent() {
                if !p.exists() {
                    println!("creating parent directory: {:?}", p);
                    fs::create_dir_all(p)
                        .map_err(|e| format!("Failed to create the parent directory: {}", e))?;
                }
            }

            let mut outfile =
                File::create(&out_path).map_err(|e| format!("Failed to create the file: {}", e))?;

            copy(&mut entry, &mut outfile)
                .map_err(|e| format!("Failed to write the file: {}", e))?;

            println!("successfully extracted: {:?}", out_path);
        }
    }

    let size = calculate_dir_size(&version_path)
        .map_err(|e| format!("Failed to calculate directory size: {}", e))?;

    println!("installation size: {} bytes", size);

    let mut data = load_versions_data();
    let stats = data
        .versions
        .entry(version.to_string())
        .or_insert(VersionStats {
            total_play_time: 0,
            last_played: 0,
            is_running: false,
            start_time: None,
            size_bytes: size,
        });
    stats.size_bytes = size;
    save_versions_data(&data);

    println!("updated version stats");

    if let Err(e) = fs::remove_file(dest_zip) {
        println!("Warning: failed to remove temporary zip file: {}", e);
    }
    println!("cleaned up zip file");

    let is_installed = utils::client::is_client_installed(version);
    println!("final installation check: {}", is_installed);

    if is_installed {
        println!("installation completed successfully");
        Ok(true)
    } else {
        if let Ok(entries) = fs::read_dir(&version_path) {
            println!("contents of {:?}:", version_path);
            for entry in entries {
                if let Ok(entry) = entry {
                    println!("  {:?}", entry.path());
                }
            }
        }
        Err("Installation failed: Client files not found after installation".to_string())
    }
}

#[tauri::command]
fn setup_hosts_file() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::ffi::OsStrExt;
        use winapi::um::{shellapi::ShellExecuteW, winuser::SW_HIDE};

        let hosts_path = match std::env::consts::OS {
            "windows" => r"C:\Windows\System32\drivers\etc\hosts",
            _ => "/etc/hosts",
        };

        if !std::path::Path::new(hosts_path).exists() {
            return Err(format!("Hosts file not found at {}", hosts_path));
        }

        let mut file = match std::fs::OpenOptions::new().read(true).open(hosts_path) {
            Ok(file) => file,
            Err(e) => return match e.kind() {
                std::io::ErrorKind::PermissionDenied => Err(
                    "Permission denied while opening the hosts file. Please run Fluster as administrator once."
                        .to_string(),
                ),
                std::io::ErrorKind::NotFound => {
                    Err(format!("Hosts file not found at {}", hosts_path))
                }
                _ => Err(format!("Failed to open hosts file: {}", e)),
            },
        };

        if file.metadata().is_ok() {
            let mut contents = String::new();

            file.read_to_string(&mut contents)
                .map_err(|e| format!("Failed to read hosts file: {}", e))?;

            if contents.contains(HOSTS_ENTRIES) {
                return Ok("Hosts file already contains Fluster entries".to_string());
            }
        }

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
    #[cfg(not(target_os = "windows"))]
    {
        write_hosts_file()
    }
}

#[tauri::command]
fn uninstall_client(version: &str) -> Result<String, String> {
    let versions = match utils::appdata::return_versions() {
        Ok(path) => path,
        Err(e) => return Err(format!("Failed to get the versions directory: {}", e)),
    };

    let version_path = versions.join(version);

    if utils::client::is_client_installed(version) == false {
        return Ok(format!("{} is not installed", version));
    }

    fs::remove_dir_all(&version_path)
        .map_err(|e| format!("Failed to remove the version directory for {}", e))?;

    Ok(format!("{} was uninstalled from the device", version))
}

fn get_versions_file_path() -> std::path::PathBuf {
    let mut path = utils::appdata::return_versions().expect("Failed to get versions directory");
    path.push("version_stats.json");
    path
}

fn load_versions_data() -> VersionsData {
    let path = get_versions_file_path();
    if !path.exists() {
        return VersionsData::default();
    }

    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => VersionsData::default(),
    }
}

fn save_versions_data(data: &VersionsData) {
    let path = get_versions_file_path();
    if let Ok(content) = serde_json::to_string_pretty(data) {
        let _ = fs::write(path, content);
    }
}

fn get_current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[tauri::command]
fn get_version_stats(version: &str) -> Result<String, String> {
    let data = load_versions_data();
    match data.versions.get(version) {
        Some(stats) => Ok(serde_json::to_string(stats).unwrap_or_default()),
        None => Ok(serde_json::to_string(&VersionStats {
            total_play_time: 0,
            last_played: 0,
            is_running: false,
            start_time: None,
            size_bytes: 0,
        })
        .unwrap_or_default()),
    }
}

fn update_version_stats(version: &str, started: bool) {
    let mut data = load_versions_data();
    let current_time = get_current_timestamp();

    let stats = data
        .versions
        .entry(version.to_string())
        .or_insert(VersionStats {
            total_play_time: 0,
            last_played: current_time,
            is_running: false,
            start_time: None,
            size_bytes: 0,
        });

    if started {
        stats.is_running = true;
        stats.start_time = Some(current_time);
        stats.last_played = current_time;
    } else if stats.is_running {
        if let Some(start_time) = stats.start_time {
            stats.total_play_time += current_time - start_time;
        }
        stats.is_running = false;
        stats.start_time = None;
    }

    save_versions_data(&data);
}

fn format_size(size: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    match size {
        size if size >= GB => format!("{:.2} GB", size as f64 / GB as f64),
        size if size >= MB => format!("{:.2} MB", size as f64 / MB as f64),
        size if size >= KB => format!("{:.2} KB", size as f64 / KB as f64),
        _ => format!("{} B", size),
    }
}

fn calculate_dir_size(path: &Path) -> std::io::Result<u64> {
    let mut total_size = 0;

    if path.is_file() {
        return Ok(fs::metadata(path)?.len());
    }

    for entry in fs::read_dir(path)? {
        let entry = entry?;
        let path = entry.path();

        if path.is_file() {
            total_size += fs::metadata(&path)?.len();
        } else if path.is_dir() {
            total_size += calculate_dir_size(&path)?;
        }
    }

    Ok(total_size)
}

#[tauri::command]
fn get_version_size(version: &str) -> Result<String, String> {
    let data = load_versions_data();
    match data.versions.get(version) {
        Some(stats) => Ok(format_size(stats.size_bytes)),
        None => {
            let versions = utils::appdata::return_versions()
                .map_err(|e| format!("Failed to get versions directory: {}", e))?;
            let version_path = versions.join(version);

            if !version_path.exists() {
                return Ok("0 B".to_string());
            }

            let size = calculate_dir_size(&version_path)
                .map_err(|e| format!("Failed to calculate size: {}", e))?;

            Ok(format_size(size))
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if std::env::args().any(|arg| arg == "--write-hosts") {
        match write_hosts_file() {
            Ok(_) => std::process::exit(0),
            Err(_) => std::process::exit(1),
        }
    }

    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel();

    let server_handle = tokio::spawn(async move {
        let config = rocket::Config::figment()
            .merge(("port", 80))
            .merge(("address", "127.0.0.1"))
            .merge(("shutdown.timeout", 0))
            .merge(("workers", 1));

        let rocket = rocket::custom(config).mount(
            "/",
            rocket::routes![
                ide::toolbox,
                ide::start,
                ide::upload,
                ide::save,
                ide::abuse_report,
                ide::help,
                ide::error_report_dialog,
                game::gameserver,
                game::machine_configuration,
                game::keep_alive_pinger,
                game::visit,
                game::join,
                asset::legacy,
                asset::v1,
                asset::v2,
                r#static::embedded,
            ],
        );

        match rocket.ignite().await {
            Ok(rocket) => {
                if let Err(e) = rocket.launch().await {
                    eprintln!("HTTP server error: {}", e);
                    if e.to_string().contains("address already in use")
                        || e.to_string().contains("permission denied")
                    {
                        eprintln!("Port 80 is either in use or requires admin privileges.");
                        eprintln!("Please ensure no other web server is running on port 80");
                        eprintln!("On Unix systems, try running with sudo");
                        eprintln!("On Windows, run as Administrator");
                        std::process::exit(1);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to start HTTP server: {}", e);
                if e.to_string().contains("address already in use")
                    || e.to_string().contains("permission denied")
                {
                    eprintln!("Port 80 is either in use or requires admin privileges.");
                    eprintln!("Please ensure no other web server is running on port 80");
                    eprintln!("On Unix systems, try running with sudo");
                    eprintln!("On Windows, run as Administrator");
                    std::process::exit(1);
                }
            }
        }
    });

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            start_server,
            start_listening,
            get_device_username,
            fluster_setup,
            setup_hosts_file,
            is_fluster_setup,
            is_version_installed,
            launch_client,
            launch_server_connection,
            install_client,
            uninstall_client,
            get_version_stats,
            get_version_size,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    let shutdown_tx = std::sync::Arc::new(std::sync::Mutex::new(Some(shutdown_tx)));
    let shutdown_tx_clone = shutdown_tx.clone();

    app.run(move |_app_handle, event| match event {
        tauri::RunEvent::ExitRequested { api, .. } => {
            if let Some(tx) = shutdown_tx_clone.lock().unwrap().take() {
                let _ = tx.send(());
            }
            api.prevent_exit();
        }
        _ => {}
    });
}
