import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

function App() {
  const [name, setName] = useState("");
  const [variables, setVariables] = useState({ name: "" });
  const { data: greetMsg = "", isLoading } = useQuery({
    enabled: !!variables.name,
    queryKey: ["greet", variables.name],
    queryFn: async () =>
      await invoke<string>("greet", { name: variables.name }),
  });

  async function greet() {
    setVariables({ name });
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
      <p className="text-center mt-4">{isLoading ? "Loading..." : greetMsg}</p>
    </main>
  );
}

export default App;
