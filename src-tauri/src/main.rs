#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod routes;
use routes::*;

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

                // embedding static routes
                //r#static::embedded_images, r#static::embedded_js, r#static::embedded_css,
            ])

            .mount("/JS", rocket::fs::FileServer::from("src/assets/js"))
            .mount("/CSS", rocket::fs::FileServer::from("src/assets/css"))
            .mount("/images", rocket::fs::FileServer::from("src/assets/images"))
            
            .launch()
            .await;
    });

    fluster_api_lib::run()
}