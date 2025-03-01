"use client";

import { Prompt, extractTemplateVariables } from "@/hooks/use-prompts";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PromptDetailProps {
  promptData: {
    prompt: Prompt | null;
    loading: boolean;
    error: string | null;
  };
}

export default function PromptDetail({ promptData }: PromptDetailProps) {
  const router = useRouter();
  const { prompt, loading, error } = promptData;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading prompt details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prompt Details</h1>
          <Link
            href="/prompts"
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Back to Prompts
          </Link>
        </div>
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error loading prompt: {error}
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prompt Not Found</h1>
          <Link
            href="/prompts"
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Back to Prompts
          </Link>
        </div>
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded">
          The prompt you're looking for could not be found.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prompt Details</h1>
        <div className="flex gap-2">
          <Link
            href="/prompts"
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Back to Prompts
          </Link>
          <Link
            href={`/prompts/${prompt.id}/edit`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit Prompt
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">{prompt.name}</h2>
            <p className="text-sm text-gray-500">
              Created: {new Date(prompt.created_at).toLocaleString()}
            </p>
          </div>
          <span className="px-3 py-1 text-sm rounded bg-gray-100">
            {prompt.type}
          </span>
        </div>

        <div className="mb-6">
          <h3 className="text-md font-medium mb-2">Prompt Content:</h3>
          <div
            className="bg-gray-50 p-4 rounded border whitespace-pre-wrap 
                          font-mono text-sm"
          >
            {prompt.prompt}
          </div>
          {prompt.type === "template" && (
            <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
              <h4 className="text-sm font-medium text-blue-700 mb-2">
                Template Variables
              </h4>
              <div className="text-sm">
                {extractTemplateVariables(prompt.prompt).map((variable) => (
                  <span
                    key={variable}
                    className="inline-block mr-2 mb-2 px-2 py-1 bg-blue-100 
                              text-blue-800 rounded"
                  >
                    {variable}
                  </span>
                ))}
                {extractTemplateVariables(prompt.prompt).length === 0 && (
                  <p className="text-gray-500">
                    No template variables found. Variables should be in the
                    format
                    {"{{variable}}"}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-md font-medium mb-2">Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {prompt.tags.length > 0 ? (
              prompt.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 rounded"
                >
                  {tag}
                </span>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No tags</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
