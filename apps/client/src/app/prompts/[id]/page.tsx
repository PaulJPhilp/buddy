import { getPromptById } from "@/hooks/use-prompts";
import PromptDetail from "./prompt-detail";

export async function generateMetadata({ params }) {
  return {
    title: `Prompt: ${params.id}`,
  };
}

export default async function PromptDetailPage({ params }) {
  // Fetch the prompt data on the server
  const promptData = await getPromptById(params.id);

  // Pass the data to a client component
  return <PromptDetail promptData={promptData} />;
}
