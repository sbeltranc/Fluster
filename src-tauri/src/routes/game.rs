#[rocket::post("/Game/MachineConfiguration.ashx")]
pub async fn machine_configuration() {
    "OK".to_string();
}

#[rocket::get("/Game/KeepAlivePinger.ashx")]
pub async fn keep_alive_pinger() {
    "OK".to_string();
}

#[rocket::get("/game/visit.ashx")]
pub async fn visit() -> String {
    return include_str!("../assets/storage/visit.lua").to_string();
}

#[rocket::get("/game/gameserver.ashx")]
pub async fn gameserver() -> String {
    return include_str!("../assets/storage/gameserver.lua").to_string();
}

#[rocket::get("/game/join.ashx")]
pub async fn join() -> String {
    return include_str!("../assets/storage/join.lua").to_string();
}