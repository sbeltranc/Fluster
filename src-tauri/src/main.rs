#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod routes;
use routes::*;

#[tokio::main]
async fn main() {
    tokio::spawn(async {
        let _ = rocket::build()
            .mount("/", rocket::routes![
                // IDE Pages
                ide::toolbox, ide::start, ide::upload, ide::save, ide::abuse_report, ide::help, ide::error_report_dialog,

                // Game APIs
                game::gameserver, game::machine_configuration, game::keep_alive_pinger, game::visit, game::join,

                // Asset APIs
                asset::legacy, asset::v1, asset::v2,

                // Embedding the static assets
                r#static::embedded,
            ])
            
            .launch()
            .await;
    });

    fluster_api_lib::run()
}