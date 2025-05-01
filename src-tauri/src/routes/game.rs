const JOIN_LUA: &str = include_str!("../assets/storage/join.lua");
const VISIT_LUA: &str = include_str!("../assets/storage/visit.lua");
const GAMESERVER_LUA: &str = include_str!("../assets/storage/gameserver.lua");

#[rocket::post("/Game/MachineConfiguration.ashx")]
pub async fn machine_configuration() {
    "OK".to_string();
}

#[rocket::get("/Game/KeepAlivePinger.ashx")]
pub async fn keep_alive_pinger() {
    "OK".to_string();
}

#[rocket::get("/Error/ReportDialog.aspx")]
pub async fn error_report_dialog() {
    "OK".to_string();
}

#[rocket::get("/game/visit.ashx")]
pub async fn visit() -> String {
    return VISIT_LUA.to_string();
}

#[rocket::get("/game/gameserver.ashx")]
pub async fn gameserver() -> String {
    return GAMESERVER_LUA.to_string();
}

#[rocket::get("/game/join.ashx")]
pub async fn join() -> String {
    return JOIN_LUA.to_string();
}