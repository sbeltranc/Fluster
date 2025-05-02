use std::path::PathBuf;
use dirs::data_local_dir;

pub fn is_fluster_setup() -> bool {
    let data = match data_local_dir() {
        Some(path) => path,
        None => return false,
    };

    let fluster_path = data.join("Fluster");
    let versions_path = fluster_path.join("versions");
    let downloads_path = fluster_path.join("downloads");

    return fluster_path.exists() && fluster_path.is_dir() &&
        versions_path.exists() && versions_path.is_dir() &&
        downloads_path.exists() && downloads_path.is_dir();
}

pub fn return_appdata() -> Result<PathBuf, String> {
    let data = data_local_dir()
        .ok_or("Failed to get the local data directory.")?;

    let appdata = data.join("Fluster");

    if !appdata.exists() {
        std::fs::create_dir_all(&appdata)
            .expect("Failed to create the Fluster AppData directory.");
    }

    return Ok(appdata);
}

pub fn return_versions() -> Result<PathBuf, String> {
    let appdata = return_appdata()?;
    let versions = appdata.join("versions");

    if !versions.exists() {
        std::fs::create_dir_all(&versions)
            .expect("Failed to create the Fluster versions directory.");
    }

    return Ok(versions);
}

pub fn return_downloads() -> Result<PathBuf, String> {
    let appdata = return_appdata()?;
    let downloads = appdata.join("downloads");

    if !downloads.exists() {
        std::fs::create_dir_all(&downloads)
            .expect("Failed to create the Fluster downloads directory.");
    }

    return Ok(downloads);
}

pub fn return_cache() -> Result<PathBuf, String> {
    let appdata = return_appdata()?;
    let cache = appdata.join("cache");

    if !cache.exists() {
        std::fs::create_dir_all(&cache)
            .expect("Failed to create the Fluster cache directory.");
    }

    return Ok(cache);
}