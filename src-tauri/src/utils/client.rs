use crate::utils::appdata;

pub fn launch_client(version: &str) -> Result<bool, String> {
    let data = match appdata::return_versions() {
        Ok(path) => path,
        Err(_) => return Err("Failed to get the versions directory.".to_string()),
    };

    if !is_client_installed(version) {
        return Err("Client is not installed.".to_string());
    }

    std::process::Command::new(data.join(version).join("Roblox.exe"))
        .spawn()
        .map_err(|_| "Failed to launch the client.".to_string())?;

    Ok(true)
}

pub fn is_client_installed(version: &str) -> bool {
    println!("checking if version {} is installed", version);
    
    let versions = match appdata::return_versions() {
        Ok(v) => {
            println!("found versions directory: {:?}", v);
            v
        },
        Err(_) => {
            println!("failed to get versions directory");
            return false;
        }
    };

    let client_path = versions.join(version);
    let client_executable = client_path.join("Roblox.exe");

    println!("checking path: {:?}", client_path);
    println!("checking executable: {:?}", client_executable);

    if !client_path.exists() || !client_path.is_dir() {
        println!("client path does not exist or is not a directory");
        return false;
    }

    if !client_executable.exists() || !client_executable.is_file() {
        println!("client executable does not exist or is not a file");
        return false;
    }

    match std::fs::metadata(&client_executable) {
        Ok(metadata) => {
            let size = metadata.len();
            println!("successfully read executable metadata. size: {} bytes", size);
            size > 0
        },
        Err(e) => {
            println!("failed to read executable metadata: {}", e);
            false
        }
    }
}