import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface LLMResponse {
  provider: 'chatgpt'
  model: string
  response: string
  tokens: number
  latencyMs: number
  error?: string
}

export async function queryOpenAI(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now()

  try {
    // Use the Responses API with web_search_preview tool
    const response = await (openai as any).responses.create({
      model: 'gpt-4o',
      tools: [{ 
        type: 'web_search_preview',
        search_context_size: 'medium',
        user_location: {
          type: 'approximate',
          country: 'US',
        }
      }],
      input: prompt,
    })

    const latencyMs = Date.now() - startTime

    // The Responses API returns output_text directly
    const responseText = response.output_text || ''

    return {
      provider: 'chatgpt',
      model: 'gpt-4o',
      response: responseText,
      tokens: response.usage?.total_tokens || 0,
      latencyMs,
    }
  } catch (error: any) {
    console.error('OpenAI Responses API error:', error.message)
    
    // Fallback to regular chat completions if Responses API fails
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })

      return {
        provider: 'chatgpt',
        model: 'gpt-4o',
        response: completion.choices[0]?.message?.content || '',
        tokens: completion.usage?.total_tokens || 0,
        latencyMs: Date.now() - startTime,
      }
    } catch (fallbackError: any) {
      return {
        provider: 'chatgpt',
        model: 'gpt-4o',
        response: '',
        tokens: 0,
        latencyMs: Date.now() - startTime,
        error: fallbackError.message,
      }
    }
  }
}
