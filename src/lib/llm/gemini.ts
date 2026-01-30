import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export interface LLMResponse {
  provider: 'gemini'
  model: string
  response: string
  tokens: number
  latencyMs: number
  error?: string
}

export async function queryGemini(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now()
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
    
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const latencyMs = Date.now() - startTime
    
    return {
      provider: 'gemini',
      model: 'gemini-pro',
      response: text,
      tokens: 0, // Gemini doesn't easily expose token count
      latencyMs,
    }
  } catch (error: any) {
    return {
      provider: 'gemini',
      model: 'gemini-pro',
      response: '',
      tokens: 0,
      latencyMs: Date.now() - startTime,
      error: error.message,
    }
  }
}
