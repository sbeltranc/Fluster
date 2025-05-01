// just fyi: all this goes static, so there isn't any need to worry about all of this

const UNSUPPORTED_TEMPLATE: &str = include_str!("../assets/Unfinished.html");

#[rocket::get("/IDE/Start.aspx")]
pub fn start() -> rocket::response::content::RawHtml<&'static str> {
    rocket::response::content::RawHtml(
        include_str!("../assets/Landing.html")
    )
}

#[rocket::get("/Game/Help.aspx")]
pub fn help() -> rocket::response::content::RawHtml<&'static str> {
    rocket::response::content::RawHtml(
        include_str!("../assets/Help.html")
    )
}

#[rocket::get("/IDE/Upload.aspx")]
pub fn upload() -> rocket::response::content::RawHtml<&'static str> {
    rocket::response::content::RawHtml(
        UNSUPPORTED_TEMPLATE
    )
}

#[rocket::get("/UI/Save.aspx")]
pub fn save() -> rocket::response::content::RawHtml<&'static str> {
    rocket::response::content::RawHtml(
        UNSUPPORTED_TEMPLATE
    )
}

#[rocket::get("/AbuseReport/InGameChat.aspx")]
pub fn abuse_report() -> rocket::response::content::RawHtml<&'static str> {
    rocket::response::content::RawHtml(
        UNSUPPORTED_TEMPLATE
    )
}

#[rocket::get("/IDE/ClientToolbox.aspx")]
pub fn toolbox() -> rocket::response::content::RawHtml<&'static str> {
    rocket::response::content::RawHtml(
        UNSUPPORTED_TEMPLATE
    )
}