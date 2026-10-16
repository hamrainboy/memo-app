export interface MemoSummary {
  text: string
  generatedAt: string // ISO 8601
  stale: boolean // 재요약 실패 등으로 본문과 어긋난 상태
}

export interface Memo {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary?: MemoSummary
  createdAt: string
  updatedAt: string
}

export interface MemoFormData {
  title: string
  content: string
  category: string
  tags: string[]
}

export type MemoCategory = 'personal' | 'work' | 'study' | 'idea' | 'other'

export const MEMO_CATEGORIES: Record<MemoCategory, string> = {
  personal: '개인',
  work: '업무',
  study: '학습',
  idea: '아이디어',
  other: '기타',
}

export type MemoFont = 'sans' | 'serif' | 'mono'

export const MEMO_FONTS: Record<MemoFont, string> = {
  sans: '고딕',
  serif: '명조',
  mono: '고정폭',
}

export const DEFAULT_FONT: MemoFont = 'sans'

export const DEFAULT_CATEGORIES = Object.keys(MEMO_CATEGORIES) as MemoCategory[]
