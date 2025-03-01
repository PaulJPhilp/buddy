"use client";

import { ApiClient, ApiClientLayer } from "@/lib/api-client";
import { Effect } from "effect";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PromptCreate } from "../../../../../../packages/api/src/PromptSchema";

export default function CreatePromptPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    type: "user", // Default to 'user'
    prompt: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag !== "");

      // Create a new prompt with current timestamp
      const newPrompt: Omit<PromptCreate, "id"> = {
        name: formData.name,
        type: formData.type as "user" | "system" | "template",
        prompt: formData.prompt,
        tags: tagsArray,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Call the API to create the prompt using ApiClient directly
      await Effect.runPromise(
        Effect.provide(
          Effect.gen(function* () {
            const client = yield* ApiClient;
            return yield* client.prompt.createPrompt({
              payload: newPrompt,
            });
          }),
          ApiClientLayer,
        ),
      );

      // Redirect to the prompts list page
      router.push("/prompts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create prompt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Prompt</h1>
        <Link
          href="/prompts"
          className="px-4 py-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
            placeholder="Enter prompt name"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="type" className="block text-sm font-medium mb-1">
            Prompt Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="user">User</option>
            <option value="system">System</option>
            <option value="template">Template</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {formData.type === "user" &&
              "User prompts are sent with each user message."}
            {formData.type === "system" &&
              "System prompts define the AI's behavior and context."}
            {formData.type === "template" &&
              "Template prompts contain variables like {{variable}} that can be replaced at runtime."}
          </p>
        </div>

        <div>
          <label htmlFor="prompt" className="block text-sm font-medium mb-1">
            Prompt Content
          </label>
          <textarea
            id="prompt"
            name="prompt"
            value={formData.prompt}
            onChange={handleChange}
            required
            rows={6}
            className="w-full p-2 border rounded"
            placeholder="Enter your prompt content here..."
          />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            placeholder="tag1, tag2, tag3"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate tags with commas (e.g., "ai, chatbot, assistant")
          </p>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                      disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Prompt"}
          </button>
        </div>
      </form>
    </div>
  );
}
