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

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a rate limit error (429)
      if (error.message?.includes('429') || error.message?.includes('Resource exhausted')) {
        const waitTime = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        console.log(`Gemini rate limited, waiting ${Math.round(waitTime)}ms before retry ${attempt + 1}/${maxRetries}`)
        await delay(waitTime)
      } else {
        // Not a rate limit error, throw immediately
        throw error
      }
    }
  }
  
  throw lastError
}

export async function queryGemini(prompt: string): Promise<LLMResponse> {
  const startTime = Date.now()

  try {
    // Try with Google Search grounding first
    const response = await retryWithBackoff(async () => {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

      // Attempt grounded search using the tools parameter in generateContent
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools: [
          {
            // @ts-ignore - Google Search grounding tool
            googleSearchRetrieval: {
              dynamicRetrievalConfig: {
                mode: 'MODE_DYNAMIC',
                dynamicThreshold: 0.3,
              },
            },
          },
        ],
      } as any)

      return result
    })

    const responseData = await response.response
    const text = responseData.text()

    const latencyMs = Date.now() - startTime

    return {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      response: text,
      tokens: 0,
      latencyMs,
    }
  } catch (error: any) {
    console.error('Gemini grounded search failed:', error.message)

    // Fallback: Try without grounding
    try {
      const fallbackResponse = await retryWithBackoff(async () => {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(prompt)
        return result
      })

      const responseData = await fallbackResponse.response
      const text = responseData.text()

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
