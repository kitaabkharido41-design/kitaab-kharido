import { openai } from '@ai-sdk/openai'
import { streamText, Message } from 'ai'
import { AGENTS, AgentPersona } from '@/lib/ai/agents'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, agentId }: { messages: Message[], agentId: AgentPersona } = await req.json()

    if (!messages || !agentId) {
      return new Response('Missing messages or agentId', { status: 400 })
    }

    const agent = AGENTS[agentId]
    if (!agent) {
      return new Response('Invalid agentId', { status: 400 })
    }

    // Build the system prompt
    const systemPrompt = agent.systemPrompt

    const result = streamText({
      model: openai('gpt-4o'), // Or 'gpt-4o-mini' for lower cost
      system: systemPrompt,
      messages,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('AI Chat Error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
