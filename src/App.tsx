import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <main className="container py-4">
      <form
        className="flex justify-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          onChange={(e) => setName(e.currentTarget.value)}
          className="border border-solid border-gray-500 rounded px-1.5 py-1"
          placeholder="Enter a name..."
        />
        <button
          type="submit"
          className="border border-solid border-gray-500 rounded px-1.5 py-1 hover:bg-gray-100"
        >
          Greet
        </button>
      </form>
      <p className="text-center mt-4">{greetMsg}</p>
    </main>
  );
}

export default App;
