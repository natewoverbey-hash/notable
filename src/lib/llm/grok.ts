import OpenAI from 'openai'

const grok = new OpenAI({
  apiKey: process.env.XAI_API_KEY!,
  baseURL: 'https://api.x.ai/v1',
  defaultHeaders: {
    'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
  },
})

export interface LLMResponse {
  provider: 'grok'
  model: string
  response: string
  tokens: number
  latencyMs: number
  error?: string
}

export async function queryGrok(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now()

  try {
    const response = await grok.chat.completions.create({
      model: 'grok-2-1212',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides accurate, specific information about real estate agents. When asked about agents in a specific area, provide specific names and brokerages when possible. Base your answers on factual information.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    const latencyMs = Date.now() - startTime
    const content = response.choices[0]?.message?.content || ''

    return {
      provider: 'grok',
      model: 'grok-2-1212',
      response: content,
      tokens: response.usage?.total_tokens || 0,
      latencyMs,
    }
  } catch (error: any) {
    return {
      provider: 'grok',
      model: 'grok-2-1212',
      response: '',
      tokens: 0,
      latencyMs: Date.now() - startTime,
      error: error.message,
    }
  }
}
