#![allow(non_snake_case)]

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

#[rocket::get("/game/join.ashx?<UserID>&<serverPort>&<serverIP>")]
pub async fn join(UserID: usize, serverPort: usize, serverIP: Option<String>) -> String {
    let ip = if serverIP.is_none() { "localhost" } else { serverIP.as_ref().unwrap() };

    let mut result = include_str!("../assets/storage/join.lua").to_string();

    result = result.replace("{{user_id}}", &UserID.to_string());
    result = result.replace("{{server_port}}", &serverPort.to_string());
    result = result.replace("{{server_ip}}", ip);

    return result;
}