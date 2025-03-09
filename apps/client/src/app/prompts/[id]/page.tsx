import { getPromptById } from "@/hooks/use-prompts";
import { Metadata } from "next";
import PromptDetail from "./prompt-detail";

interface PageParams {
  id: string;
}

interface PageProps {
  params: Promise<PageParams>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: `Prompt: ${resolvedParams.id}`,
  };
}

export default async function PromptDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  // Fetch the prompt data on the server
  const promptData = await getPromptById(resolvedParams.id);

  // Pass the data to a client component
  return <PromptDetail promptData={promptData} />;
}
