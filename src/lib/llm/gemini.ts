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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    // Use generateContent with Google Search grounding
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      tools: [
        {
          googleSearch: {},
        } as any,
      ],
    } as any)

    const response = await result.response
    const text = response.text()

    const latencyMs = Date.now() - startTime

    return {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      response: text,
      tokens: 0,
      latencyMs,
    }
  } catch (error: any) {
    // Fallback without search if grounding fails
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        response: text,
        tokens: 0,
        latencyMs: Date.now() - startTime,
      }
    } catch (fallbackError: any) {
      return {
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        response: '',
        tokens: 0,
        latencyMs: Date.now() - startTime,
        error: fallbackError.message,
      }
    }
  }
}
