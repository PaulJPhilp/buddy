"use client";

import { Prompt } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CreatePromptVoiceFormProps {
  prompts: Prompt[];
}

export default function CreatePromptVoiceForm({
  prompts,
}: CreatePromptVoiceFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "standard",
    label: "",
    key: "",
    promptId: "",
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
      // This is a placeholder - you'll need to implement the actual API call
      // For now, we'll just simulate a successful creation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to the prompt voices list page
      router.push("/prompt-voices");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <input
            type="text"
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            The type of voice (e.g., standard, professional, creative)
          </p>
        </div>

        <div>
          <label htmlFor="label" className="block text-sm font-medium">
            Label
          </label>
          <input
            type="text"
            id="label"
            name="label"
            value={formData.label}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="key" className="block text-sm font-medium">
            Key
          </label>
          <input
            type="text"
            id="key"
            name="key"
            value={formData.key}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            A unique identifier for this voice
          </p>
        </div>

        <div>
          <label htmlFor="promptId" className="block text-sm font-medium">
            Associated Prompt
          </label>
          <select
            id="promptId"
            name="promptId"
            value={formData.promptId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            required
          >
            <option value="">Select a prompt</option>
            {prompts.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.name} ({prompt.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Prompt Voice"}
        </button>
      </div>
    </form>
  );
}
