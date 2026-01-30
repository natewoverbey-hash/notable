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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 1000,
    })

    const latencyMs = Date.now() - startTime
    
    return {
      provider: 'chatgpt',
      model: 'gpt-4o',
      response: completion.choices[0]?.message?.content || '',
      tokens: completion.usage?.total_tokens || 0,
      latencyMs,
    }
  } catch (error: any) {
    return {
      provider: 'chatgpt',
      model: 'gpt-4o',
      response: '',
      tokens: 0,
      latencyMs: Date.now() - startTime,
      error: error.message,
    }
  }
}
