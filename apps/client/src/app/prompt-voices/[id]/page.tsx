import { getPromptVoiceById } from "@/hooks/use-prompt-voices";
import Link from "next/link";

export async function generateMetadata({ params }) {
  return {
    title: `Prompt Voice: ${params.id}`,
  };
}

export default async function PromptVoiceDetailPage({ params }) {
  // Fetch the prompt voice data on the server
  const { promptVoice, loading, error } = await getPromptVoiceById(params.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/prompt-voices" className="text-blue-500 hover:underline">
          ← Back to Prompt Voices
        </Link>
        <h1 className="text-2xl font-bold">
          {loading ? "Loading..." : promptVoice?.name}
        </h1>
      </div>

      {loading && (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading prompt voice...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {!loading && !error && promptVoice && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">{promptVoice.name}</h2>
              <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                {promptVoice.type}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Description</h3>
              <p className="mt-1">{promptVoice.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Label</h3>
                <p className="mt-1">{promptVoice.label}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Key</h3>
                <p className="mt-1">{promptVoice.key}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Created</h3>
              <p className="mt-1">
                {new Date(promptVoice.created_at).toLocaleString()}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">
                Last Updated
              </h3>
              <p className="mt-1">
                {new Date(promptVoice.updated_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold">Associated Prompt</h2>

            <div className="flex justify-between">
              <h3 className="text-lg">{promptVoice.prompt.name}</h3>
              <span
                className={`px-2 py-1 text-xs rounded ${promptVoice.prompt.type === "system"
                  ? "bg-purple-100 text-purple-800"
                  : promptVoice.prompt.type === "template"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                  }`}
              >
                {promptVoice.prompt.type}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Prompt Text</h3>
              <div className="mt-2 p-4 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap">
                {promptVoice.prompt.prompt}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Tags</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {promptVoice.prompt.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-gray-100 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {promptVoice.prompt.tags.length === 0 && (
                  <span className="text-sm text-gray-500">No tags</span>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href={`/prompts/${promptVoice.prompt.id}`}
                className="text-blue-500 hover:underline"
              >
                View Prompt Details
              </Link>
            </div>
          </div>

          <div className="flex justify-between">
            <Link
              href={`/prompt-voices/${promptVoice.id}/edit`}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Edit Prompt Voice
            </Link>
            <button
              type="button"
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Prompt Voice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
