// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:todos.db",
                    vec![tauri_plugin_sql::Migration {
                        version: 1,
                        description: "create todos table",
                        sql: "CREATE TABLE IF NOT EXISTS todos (
                            id INTEGER PRIMARY KEY,
                            text TEXT NOT NULL,
                            completed INTEGER NOT NULL DEFAULT 0
                        );",
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }],
                )
                .build(),
        )
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
