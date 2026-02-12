use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize)]
struct Todo {
    id: u64,
    text: String,
    completed: bool,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn save_todos(app_handle: tauri::AppHandle, todos: Vec<Todo>) -> Result<(), String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    // Create directory if it doesn't exist
    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    
    let file_path = app_dir.join("todos.json");
    println!("Saving todos to: {:?}", file_path);
    
    let json = serde_json::to_string_pretty(&todos).map_err(|e| e.to_string())?;
    
    fs::write(&file_path, json).map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(())
}

#[tauri::command]
fn load_todos(app_handle: tauri::AppHandle) -> Result<Vec<Todo>, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let file_path = app_dir.join("todos.json");
    println!("Loading todos from: {:?}", file_path);
    
    if !file_path.exists() {
        println!("Todos file doesn't exist, returning empty array");
        return Ok(Vec::new());
    }
    
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let todos: Vec<Todo> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    println!("Loaded {} todos", todos.len());
    Ok(todos)
}

#[tauri::command]
fn get_todos_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    
    let file_path = app_dir.join("todos.json");
    Ok(file_path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, save_todos, load_todos, get_todos_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
