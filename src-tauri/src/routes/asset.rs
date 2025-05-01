async fn obtain_asset_from_roblox(id: usize) -> Result<Vec<u8>, String> {
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