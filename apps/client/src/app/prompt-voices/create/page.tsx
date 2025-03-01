import { getPrompts } from "@/hooks/use-prompts";
import Link from "next/link";
import CreatePromptVoiceForm from "./create-form";

export default async function CreatePromptVoicePage() {
  // Fetch prompts data on the server
  const { prompts } = await getPrompts();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/prompt-voices" className="text-blue-500 hover:underline">
          ← Back to Prompt Voices
        </Link>
        <h1 className="text-2xl font-bold">Create Prompt Voice</h1>
      </div>

      <CreatePromptVoiceForm prompts={prompts} />
    </div>
  );
}
