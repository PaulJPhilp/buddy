import { getPromptById } from "@/hooks/use-prompts";
import React from "react";
import PromptDetail from "./prompt-detail";

export default async function PromptDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch the prompt data on the server
  const promptData = await getPromptById(params.id);

  // Pass the data to a client component
  return <PromptDetail promptData={promptData} />;
}
