#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use rocket::http::ContentType;
use include_dir::{ include_dir, Dir };

mod routes;
use routes::*;

static ASSETS: Dir = include_dir!("$CARGO_MANIFEST_DIR/src/assets");

#[rocket::get("/<path..>")]
pub fn embedded(path: PathBuf) -> Option<(ContentType, Vec<u8>)> {
    let file = ASSETS.get_file(path.to_str()?)?;
    let ext = file
        .path()
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let ct = ContentType::from_extension(ext).unwrap_or(ContentType::Bytes);
    Some((ct, file.contents().to_vec()))
}

#[tokio::main]
async fn main() {
    tokio::spawn(async {
        let _ = rocket::build()
            .mount("/", rocket::routes![
                // IDE Pages
                ide::toolbox, ide::start, ide::upload, ide::save, ide::abuse_report, ide::help,

                // Game APIs
                game::gameserver, game::machine_configuration, game::keep_alive_pinger, game::visit, game::error_report_dialog, game::join,

                // Asset APIs
                asset::legacy, asset::v1, asset::v2,

                // Embedding the static assets
                embedded,
            ])
            
            .launch()
            .await;
    });

    fluster_api_lib::run()
}