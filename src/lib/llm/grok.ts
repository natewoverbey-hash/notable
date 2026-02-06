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
  
  const apiKey = process.env.GROK_API_KEY
  const keyExists = !!apiKey
  const keyLength = apiKey?.length || 0
  const keyStart = apiKey?.substring(0, 4) || 'none'
  
  if (!apiKey) {
    return {
      provider: 'grok',
      model: 'grok-4-latest',
      response: '',
      tokens: 0,
      latencyMs: Date.now() - startTime,
      error: `GROK_API_KEY not set. Exists: ${keyExists}, Length: ${keyLength}, Start: ${keyStart}`,
    }
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-4-latest',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides accurate, specific information about real estate agents. When asked about agents in a specific area, provide specific names and brokerages when possible.',
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
      throw new Error(`${response.status}: ${JSON.stringify(data)}`)
    }

    const content = data.choices?.[0]?.message?.content || ''

    return {
      provider: 'grok',
      model: 'grok-4-latest',
      response: content,
      tokens: data.usage?.total_tokens || 0,
      latencyMs: Date.now() - startTime,
    }
  } catch (error: any) {
    return {
      provider: 'grok',
      model: 'grok-4-latest',
      response: '',
      tokens: 0,
      latencyMs: Date.now() - startTime,
      error: error.message,
    }
  }
}
