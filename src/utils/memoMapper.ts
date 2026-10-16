import { Memo, MemoFormData, MemoSummary } from '@/types/memo'

// memos 테이블 row (snake_case)
export interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  summary: MemoSummary | null
  created_at: string
  updated_at: string
}

export const rowToMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags ?? [],
  ...(row.summary ? { summary: row.summary } : {}),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const formToRow = (formData: MemoFormData) => ({
  title: formData.title,
  content: formData.content,
  category: formData.category,
  tags: formData.tags,
})
