import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface LLMResponse {
  provider: 'claude'
  model: string
  response: string
  tokens: number
  latencyMs: number
  error?: string
}

export async function queryAnthropic(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now()
  
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const latencyMs = Date.now() - startTime
    const textContent = message.content.find(block => block.type === 'text')
    
    return {
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
      response: textContent?.type === 'text' ? textContent.text : '',
      tokens: message.usage.input_tokens + message.usage.output_tokens,
      latencyMs,
    }
  } catch (error: any) {
    return {
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
      response: '',
      tokens: 0,
      latencyMs: Date.now() - startTime,
      error: error.message,
    }
  }
}
