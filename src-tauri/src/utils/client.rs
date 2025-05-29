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
    let versions = match appdata::return_versions() {
        Ok(v) => v,
        Err(_) => return false,
    };

    let client_path = versions.join(version);
    let client_executable = client_path.join("Roblox.exe");

    return client_path.exists() && client_executable.exists() && client_path.is_dir() && client_executable.is_file();
}