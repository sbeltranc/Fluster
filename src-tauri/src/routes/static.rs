use std::path::PathBuf;
use rocket::http::ContentType;
use include_dir::{ include_dir, Dir };

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