import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

type FilterType = "all" | "active" | "completed";

// Query and mutation functions
async function fetchTodos(): Promise<Todo[]> {
  return await invoke<Todo[]>("load_todos");
}

async function saveTodos(todos: Todo[]): Promise<void> {
  await invoke("save_todos", { todos });
}

function App() {
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const queryClient = useQueryClient();

  // Query for loading todos
  const {
    data: todos = [],
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    retry: 2,
  });

  // Mutation for adding a todo
  const addTodoMutation = useMutation({
    mutationFn: async (text: string) => {
      const newTodo: Todo = {
        id: Date.now(),
        text: text.trim(),
        completed: false,
      };
      const updatedTodos = [...todos, newTodo];
      await saveTodos(updatedTodos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      console.error("Failed to add todo:", error);
      alert(`Failed to add todo: ${error}`);
    },
  });

  // Mutation for toggling a todo
  const toggleTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      const updatedTodos = todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      );
      await saveTodos(updatedTodos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      console.error("Failed to toggle todo:", error);
    },
  });

  // Mutation for deleting a todo
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      const updatedTodos = todos.filter((todo) => todo.id !== id);
      await saveTodos(updatedTodos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      console.error("Failed to delete todo:", error);
    },
  });

  // Mutation for clearing completed todos
  const clearCompletedMutation = useMutation({
    mutationFn: async () => {
      const updatedTodos = todos.filter((todo) => !todo.completed);
      await saveTodos(updatedTodos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
    onError: (error) => {
      console.error("Failed to clear completed todos:", error);
    },
  });

  function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    if (inputValue.trim() === "") return;
    addTodoMutation.mutate(inputValue);
    setInputValue("");
  }

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.filter((todo) => todo.completed).length;

  if (isLoading) {
    return (
      <main className="container max-w-2xl mx-auto py-8">
        <div className="text-center text-gray-500">Loading todos...</div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="container max-w-2xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            ❌ Failed to load todos: {error?.toString()}
          </div>
          <button
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["todos"] })
            }
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="container max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        📝 Todo List
      </h1>

      {/* Add Todo Form */}
      <form onSubmit={handleAddTodo} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="What needs to be done?"
            disabled={addTodoMutation.isPending}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={addTodoMutation.isPending}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addTodoMutation.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 pb-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All ({todos.length})
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "active"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Active ({activeCount})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === "completed"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Todo List */}
      <div className="space-y-2 mb-4">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            {filter === "all"
              ? "No todos yet. Add one above!"
              : filter === "active"
                ? "No active todos"
                : "No completed todos"}
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodoMutation.mutate(todo.id)}
                disabled={toggleTodoMutation.isPending}
                className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
              />
              <span
                className={`flex-1 ${
                  todo.completed
                    ? "line-through text-gray-400"
                    : "text-gray-800"
                }`}
              >
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodoMutation.mutate(todo.id)}
                disabled={deleteTodoMutation.isPending}
                className="px-3 py-1 text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {/* Clear Completed Button */}
      {completedCount > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => clearCompletedMutation.mutate()}
            disabled={clearCompletedMutation.isPending}
            className="px-4 py-2 text-sm text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearCompletedMutation.isPending
              ? "Clearing..."
              : `Clear completed (${completedCount})`}
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
