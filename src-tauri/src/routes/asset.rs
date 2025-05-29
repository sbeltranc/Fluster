use dirs::data_local_dir;

async fn obtain_asset_from_roblox(id: usize) -> Result<Vec<u8>, String> {
    let data = match data_local_dir() {
        Some(path) => path,
        None => return Err("Failed to get local data directory".to_string())
    };

    let cache_dir = data.join("Fluster").join("cache");

    if !cache_dir.exists() {
        std::fs::create_dir_all(&cache_dir)
            .map_err(
                |e| format!("Creating the Fluster cache directory failed: {}", e),
            )?;
    }

    let hash = format!("{:x}", md5::compute(id.to_string()));
    let cache_file = cache_dir.join(hash);

    if cache_file.exists() {
        let bytes = std::fs::read(&cache_file)
            .map_err(|e| format!("Reading the cache file failed: {}", e))?;
        return Ok(bytes);
    }

    let url = format!("https://assetdelivery.roblox.com/v1/asset?id={}", id);

    let response = reqwest::get(&url)
        .await
        .unwrap();

    match response.status() {
        reqwest::StatusCode::OK => {
            let text = response.text().await;
            match text {
                Ok(text) => {
                    let bytes = text.into_bytes();

                    std::fs::write(&cache_file, &bytes)
                        .map_err(|e| format!("Writing the cache file failed: {}", e))?;

                    Ok(bytes)
                }
                Err(_) => {
                    Err("Failed to read asset data".to_string())
                }
            }
        }

        reqwest::StatusCode::NOT_FOUND => {
            Err("Asset not found".to_string())
        }

        _ => {
            Err("Failed to fetch asset".to_string())
        }
    }
}

#[rocket::get("/asset?<id>")]
pub async fn legacy(id: usize) -> Result<Vec<u8>, String> {
    let result = obtain_asset_from_roblox(id).await;
    match result {
        Ok(bytes) => {
            Ok(bytes)
        }

        Err(err) => {
            Err(err)
        }
    }
}

#[rocket::get("/v1/asset/<id>")]
pub async fn v1(id: usize) -> Result<Vec<u8>, String> {
    let result = obtain_asset_from_roblox(id).await;
    match result {
        Ok(bytes) => {
            Ok(bytes)
        }

        Err(err) => {
            Err(err)
        }
    }
}

#[rocket::get("/v2/asset/<id>")]
pub async fn v2(id: usize) -> Result<Vec<u8>, String> {
    let result = obtain_asset_from_roblox(id).await;
    match result {
        Ok(bytes) => {
            Ok(bytes)
        }

        Err(err) => {
            Err(err)
        }
    }
}