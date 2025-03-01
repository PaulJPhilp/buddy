import { Prompt } from "@api/core";

// Mock data for prompts
export const mockPrompts: Prompt[] = [
  {
    id: "1",
    name: "Customer Support Response",
    prompt:
      "You are a helpful customer support agent. Respond to the following query in a friendly and professional manner: {{query}}",
    type: "template",
    tags: ["customer-support", "template"],
    created_at: "2023-01-15T12:00:00Z",
    updated_at: "2023-01-15T12:00:00Z",
  },
  {
    id: "2",
    name: "Code Helper",
    type: "system",
    prompt:
      "You are a coding assistant that helps with programming questions and debugging.",
    tags: ["coding", "programming", "debug"],
    created_at: "2023-01-15T12:00:00Z",
    updated_at: "2023-01-15T12:00:00Z",
  },
];

// Server-side function to get prompt by ID
export async function getPromptById(id: string) {
  // In a real app, this would be an API call
  // For now, we'll simulate a delay and return mock data
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const prompt = mockPrompts.find((p) => p.id === id) || null;
    return {
      prompt,
      loading: false,
      error: null,
    };
  } catch (error) {
    return {
      prompt: null,
      loading: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Server-side function to get all prompts
export async function getPrompts() {
  // In a real app, this would be an API call
  // For now, we'll simulate a delay and return mock data
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    return {
      prompts: mockPrompts,
      loading: false,
      error: null,
    };
  } catch (error) {
    return {
      prompts: [],
      loading: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Utility function to extract template variables from a prompt
export function extractTemplateVariables(prompt: string): string[] {
  const regex = /{{(.*?)}}/g;
  const matches = prompt.match(regex);
  return matches ? matches.map((match) => match.replace(/{{|}}/g, "")) : [];
}

// Utility function to replace template variables in a prompt
export function replaceTemplateVariables(
  prompt: string,
  variables: Record<string, string>,
): string {
  let result = prompt;

  // Replace each variable in the template
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    result = result.replace(regex, value);
  }

  return result;
}

/***
// For client components that need React hooks
// Add 'use client' directive at the top of your component file when using these
import { useEffect, useState } from 'react'

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const result = await getPrompts();
        setPrompts(result.prompts);
        setError(result.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPrompts()
  }, [])

  return { prompts, loading, error }
}

export function usePrompt(id: string) {
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!id) return

      try {
        const result = await getPromptById(id);
        setPrompt(result.prompt);
        setError(result.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setPrompt(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPrompt()
  }, [id])

  return { prompt, loading, error }
}
***/

export { Prompt };
