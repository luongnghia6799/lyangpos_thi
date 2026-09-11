use std::path::PathBuf;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub port: u16,
    pub host: String,
    pub database_url: String,
    pub uploads_dir: PathBuf,
    pub web_dist_dir: Option<PathBuf>,
}

impl AppConfig {
    pub fn load() -> Self {
        dotenvy::dotenv().ok();

        let args: Vec<String> = std::env::args().collect();
        
        // 1. Resolve Port: --port <num> or LYANG_PORT or PORT or Default 3579
        let mut cli_port = None;
        let mut cli_db = None;
        let mut i = 0;
        while i < args.len() {
            if args[i] == "--port" && i + 1 < args.len() {
                cli_port = args[i + 1].parse::<u16>().ok();
                i += 1;
            } else if args[i] == "--db" && i + 1 < args.len() {
                cli_db = Some(args[i + 1].clone());
                i += 1;
            }
            i += 1;
        }

        let port = cli_port
            .or_else(|| std::env::var("LYANG_PORT").ok().and_then(|p| p.parse().ok()))
            .or_else(|| std::env::var("PORT").ok().and_then(|p| p.parse().ok()))
            .unwrap_or(3579);

        let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());

        let base_dir = crate::utils::get_app_base_dir();

        // 2. Resolve Database: --db <name> or DATABASE_URL or LYANG_DB or easypos.db
        let database_url = if let Some(db_name) = cli_db {
            let db_path = base_dir.join(db_name);
            format!("sqlite://{}", db_path.display())
        } else if let Ok(url) = std::env::var("DATABASE_URL") {
            url
        } else {
            let db_name = std::env::var("LYANG_DB").unwrap_or_else(|_| "easypos.db".to_string());
            let db_path = base_dir.join(db_name);
            format!("sqlite://{}", db_path.display())
        };

        let uploads_dir = base_dir.join("uploads");
        let _ = std::fs::create_dir_all(&uploads_dir);

        // 3. Resolve Frontend Dist Directory for Direct Web Access (Chrome/Safari via LAN IP)
        let mut possible_dist_paths = vec![
            base_dir.join("dist"),
            base_dir.join("frontend").join("dist"),
            base_dir.join("..").join("frontend").join("dist"),
            std::path::PathBuf::from("frontend/dist"),
            std::path::PathBuf::from("dist"),
            std::path::PathBuf::from("../dist"),
            std::path::PathBuf::from("../../frontend/dist"),
        ];

        // Also check relative to current executable binary (Tauri installation directory)
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                possible_dist_paths.push(exe_dir.join("dist"));
                possible_dist_paths.push(exe_dir.join("..").join("dist"));
                possible_dist_paths.push(exe_dir.join("..").join("Resources").join("dist")); // macOS bundle
            }
        }

        let mut web_dist_dir = None;
        for p in possible_dist_paths {
            if p.exists() && p.join("index.html").exists() {
                if let Ok(canonical) = p.canonicalize() {
                    web_dist_dir = Some(canonical);
                } else {
                    web_dist_dir = Some(p);
                }
                break;
            }
        }

        Self {
            port,
            host,
            database_url,
            uploads_dir,
            web_dist_dir,
        }
    }
}

