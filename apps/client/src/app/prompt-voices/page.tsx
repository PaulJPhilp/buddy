import { getPromptVoices } from "@/hooks/use-prompt-voices";
import Link from "next/link";

export default async function PromptVoicesPage() {
  // Fetch prompt voices data on the server
  const { promptVoices, loading, error } = await getPromptVoices();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Prompt Voices</h1>
        <Link
          href="/prompt-voices/create"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Voice
        </Link>
      </div>

      {loading && <p className="text-gray-500">Loading prompt voices...</p>}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error loading prompt voices: {error}
        </div>
      )}

      {!loading && promptVoices.length === 0 && !error && (
        <div className="p-4 bg-gray-100 text-gray-700 rounded">
          No prompt voices found. Create your first prompt voice!
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {promptVoices.map((voice) => (
          <div
            key={voice.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-lg font-semibold">{voice.name}</h2>
              <span className="px-2 py-1 text-xs rounded bg-purple-100 text-purple-800">
                {voice.type}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {voice.description}
            </p>

            <div className="mb-3">
              <div className="text-xs text-gray-500">
                Associated Prompt: {voice.prompt.name}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {new Date(voice.created_at).toLocaleDateString()}
              </span>
              <Link
                href={`/prompt-voices/${voice.id}`}
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
