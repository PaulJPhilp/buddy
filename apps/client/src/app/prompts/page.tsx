"use client";

import { extractTemplateVariables, getPrompts } from "@/hooks/use-prompts";
import Link from "next/link";

export default async function PromptsPage() {
  // Fetch prompts data on the server
  const { prompts, loading, error } = await getPrompts();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prompts</h1>
        <Link
          href="/prompts/create"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Prompt
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading prompts...</p>}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error loading prompts: {error}
        </div>
      )}

      {!loading && prompts.length === 0 && !error && (
        <div className="p-4 bg-gray-100 text-gray-700 rounded">
          No prompts found. Create your first prompt!
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {prompts.map((prompt) => (
          <div
            key={prompt.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{prompt.name}</h2>
              <span
                className={`px-2 py-1 text-xs rounded ${prompt.type === "system"
                    ? "bg-purple-100 text-purple-800"
                    : prompt.type === "template"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
              >
                {prompt.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">
              {prompt.prompt}
            </p>

            {prompt.type === "template" && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {extractTemplateVariables(prompt.prompt).map((variable) => (
                    <span
                      key={variable}
                      className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 
                                rounded-full border border-blue-100"
                    >
                      {variable}
                    </span>
                  ))}
                  {extractTemplateVariables(prompt.prompt).length === 0 && (
                    <span className="text-xs text-gray-500">No variables</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1 mb-3">
              {prompt.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {new Date(prompt.created_at).toLocaleDateString()}
              </span>
              <Link
                href={`/prompts/${prompt.id}`}
                className="text-sm text-blue-500 hover:underline"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
