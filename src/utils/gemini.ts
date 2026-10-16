// 서버 전용: Gemini 요약 호출 (서버 액션에서만 import)
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent'
export const MAX_CONTENT_LENGTH = 20000
// Gemini 응답이 느릴 때(수십 초) 성공할 요청을 끊지 않도록 넉넉하게 둔다.
const REQUEST_TIMEOUT_MS = 40000
const MAX_ATTEMPTS = 2
const RETRY_DELAY_MS = 1000
// 서버가 빠르게 5xx로 응답한 경우만 재시도. 429(한도)나 4xx는 재시도해도 소용없고,
// 타임아웃은 재시도하면 대기만 길어지므로 즉시 실패 처리한다.
const RETRYABLE_STATUSES = new Set([500, 502, 503, 504])

const SYSTEM_PROMPT =
  '메모를 메모 본문과 같은 언어로 1~3개 문장으로 요약하라. 서두나 설명 없이 요약문만 출력하라. 마크다운 서식은 사용하지 마라.'

interface GeminiResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] }
  }[]
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const fetchGemini = async (
  apiKey: string,
  payload: string
): Promise<Response> => {
  let response: Response
  for (let attempt = 1; ; attempt++) {
    response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: payload,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!RETRYABLE_STATUSES.has(response.status) || attempt >= MAX_ATTEMPTS) {
      return response
    }
    console.error(
      `Gemini API 일시 오류 (${response.status}), 재시도 ${attempt}/${MAX_ATTEMPTS - 1}`
    )
    await sleep(RETRY_DELAY_MS)
  }
}

// 실패 시 사용자에게 보여줄 메시지를 담은 Error를 던진다
export const generateSummary = async (
  title: string,
  content: string
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('서버에 API key가 설정되지 않았습니다.')
  }
  if (!content.trim()) {
    throw new Error('요약할 내용이 없습니다.')
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new Error(
      `메모가 너무 깁니다. ${MAX_CONTENT_LENGTH.toLocaleString()}자 이하만 요약할 수 있습니다.`
    )
  }

  try {
    const response = await fetchGemini(
      apiKey,
      JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          { parts: [{ text: `제목: ${title}\n\n본문:\n${content}` }] },
        ],
      })
    )

    if (!response.ok) {
      console.error('Gemini API error:', response.status, await response.text())
      if (response.status === 429) {
        throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.')
      }
      if (response.status === 503) {
        throw new Error(
          'AI 서버가 일시적으로 혼잡합니다. 잠시 후 다시 시도해 주세요.'
        )
      }
      throw new Error('AI 요약 요청에 실패했습니다.')
    }

    const data = (await response.json()) as GeminiResponse
    const text = (data.candidates?.[0]?.content?.parts ?? [])
      .map(part => part.text ?? '')
      .join('')
      .trim()

    if (!text) {
      throw new Error('AI가 요약을 생성하지 못했습니다.')
    }
    return text
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new Error(
        'AI 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
      )
    }
    if (error instanceof Error && !(error instanceof TypeError)) throw error
    console.error('Gemini API request failed:', error)
    throw new Error('AI 요약 요청에 실패했습니다.')
  }
}
