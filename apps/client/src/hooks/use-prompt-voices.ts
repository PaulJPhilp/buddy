import { PromptVoice } from "../../../../packages/api/src/PromptVoiceSchema";

// Mock data for prompt voices
const mockPromptVoices: PromptVoice[] = [
  {
    id: "voice-1",
    name: "Default Voice",
    description: "Standard voice for general use",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    type: "standard",
    label: "Default",
    key: "default_voice",
    prompt: {
      id: "1",
      name: "Default Prompt",
      type: "system",
      prompt: "You are a helpful assistant.",
      tags: ["default"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "voice-2",
    name: "Professional Voice",
    description: "Formal tone for business communications",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    type: "professional",
    label: "Professional",
    key: "professional_voice",
    prompt: {
      id: "2",
      name: "Professional Prompt",
      type: "system",
      prompt: "You are a professional business assistant.",
      tags: ["business", "formal"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  {
    id: "voice-3",
    name: "Creative Voice",
    description: "Imaginative tone for creative writing",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    type: "creative",
    label: "Creative",
    key: "creative_voice",
    prompt: {
      id: "3",
      name: "Creative Prompt",
      type: "system",
      prompt: "You are a creative writing assistant with a vivid imagination.",
      tags: ["creative", "writing"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
];

// =========================================================
// SERVER-SIDE FUNCTIONS (for use in Server Components)
// =========================================================

/**
 * Get all prompt voices (server-side function)
 * For use in Server Components only
 */
export async function getPromptVoices() {
  // In a real implementation, this would call your API
  // For now, return mock data with a small delay to simulate network
  await new Promise((resolve) => setTimeout(resolve, 100));

  return {
    promptVoices: mockPromptVoices,
    loading: false,
    error: null,
  };
}

/**
 * Get a specific prompt voice by ID (server-side function)
 * For use in Server Components only
 */
export async function getPromptVoiceById(id: string) {
  // In a real implementation, this would call your API
  // For now, return mock data with a small delay to simulate network
  await new Promise((resolve) => setTimeout(resolve, 100));

  const promptVoice = mockPromptVoices.find((voice) => voice.id === id) || null;

  return {
    promptVoice,
    loading: false,
    error: promptVoice ? null : "Prompt voice not found",
  };
}

/***
// =========================================================
// CLIENT-SIDE HOOKS (for use in Client Components)
// =========================================================

import { useEffect, useState } from 'react'
import { Prompt, PromptVoice, PromptVoiceApiGroup } from 'api'
import { ApiClient, ApiClientLayer } from '@/lib/api-client'
import { Effect, Layer } from 'effect'
import { FetchHttpClient } from '@effect/platform'

/**
 * Hook to fetch all prompt voices
 * For use in Client Components only
 */
/**** 
export function usePromptVoices() {
  const [promptVoices, setPromptVoices] = useState<PromptVoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPromptVoices = async () => {
      try {
        setLoading(true)
        // This is a placeholder - you'll need to implement the actual API call
        // based on your PromptVoiceApiGroup endpoints
        
        // Example of how you might call your API:
        // const result = await Effect.runPromise(
        //   callApi((client) => PromptVoiceApiGroup.getPromptVoices(client)())
        // )
        // setPromptVoices(result)
        
        // For now, just use our mock data
        setPromptVoices(mockPromptVoices)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPromptVoices()
  }, [])

  return { promptVoices, loading, error }
}
***/

/**
 * Hook to fetch a specific prompt voice by ID
 * For use in Client Components only
 */
/***
export function usePromptVoice(id: string) {
  const [promptVoice, setPromptVoice] = useState<PromptVoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPromptVoice = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        // This is a placeholder - you'll need to implement the actual API call
        
        // Example of how you might call your API:
        // const result = await Effect.runPromise(
        //   callApi((client) => PromptVoiceApiGroup.getPromptVoiceById(client)(id))
        // )
        // setPromptVoice(result)
        
        // For now, use our mock data
        const voice = mockPromptVoices.find(voice => voice.id === id) || null
        setPromptVoice(voice)
        setError(voice ? null : 'Prompt voice not found')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchPromptVoice()
  }, [id])

  return { promptVoice, loading, error }
}
  ***/
