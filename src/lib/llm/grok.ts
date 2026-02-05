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
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-3',
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
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(JSON.stringify(data))
    }

    const latencyMs = Date.now() - startTime
    const content = data.choices?.[0]?.message?.content || ''

    return {
      provider: 'grok',
      model: 'grok-3',
      response: content,
      tokens: data.usage?.total_tokens || 0,
      latencyMs,
    }
  } catch (error: any) {
    return {
      provider: 'grok',
      model: 'grok-3',
      response: '',
      tokens: 0,
      latencyMs: Date.now() - startTime,
      error: error.message,
    }
  }
}
