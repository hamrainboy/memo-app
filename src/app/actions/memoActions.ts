'use server'

import { Memo, MemoFormData, MemoSummary } from '@/types/memo'
import { createSupabaseClient } from '@/utils/supabase/server'
import { MemoRow, formToRow, rowToMemo } from '@/utils/memoMapper'
import { generateSummary } from '@/utils/gemini'

const TABLE = 'memos'

export interface SummarizeResult {
  // 요약 시점의 본문과 DB 본문이 같을 때만 갱신된 메모를 반환 (삭제/재수정 시 null)
  memo: Memo | null
  error?: string
}

export async function getMemos(): Promise<Memo[]> {
  const { data, error } = await createSupabaseClient()
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
    .returns<MemoRow[]>()

  if (error) {
    console.error('Failed to load memos:', error.message)
    throw new Error('메모를 불러오지 못했습니다.')
  }
  return data.map(rowToMemo)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const { data, error } = await createSupabaseClient()
    .from(TABLE)
    .insert(formToRow(formData))
    .select()
    .single<MemoRow>()

  if (error) {
    console.error('Failed to create memo:', error.message)
    throw new Error('메모를 저장하지 못했습니다.')
  }
  return rowToMemo(data)
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo | null> {
  const { data, error } = await createSupabaseClient()
    .from(TABLE)
    .update({ ...formToRow(formData), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .maybeSingle<MemoRow>()

  if (error) {
    console.error('Failed to update memo:', error.message)
    throw new Error('메모를 수정하지 못했습니다.')
  }
  return data ? rowToMemo(data) : null
}

export async function deleteMemo(id: string): Promise<void> {
  const { error } = await createSupabaseClient()
    .from(TABLE)
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete memo:', error.message)
    throw new Error('메모를 삭제하지 못했습니다.')
  }
}

// 요약 실행: snapshot(title/content) 기준으로 요청하고, 저장 시점에 본문이 같을 때만 반영
export async function summarizeMemo(
  id: string,
  title: string,
  content: string
): Promise<SummarizeResult> {
  const supabase = createSupabaseClient()

  // snapshot과 본문이 같은 행에만 적용 (조건이 어긋나면 0행 → null)
  const applyToCurrent = async (
    buildSummary: (current: MemoRow) => MemoSummary | null
  ): Promise<Memo | null> => {
    const { data: current, error: readError } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .eq('title', title)
      .eq('content', content)
      .maybeSingle<MemoRow>()
    if (readError) {
      console.error('Failed to read memo:', readError.message)
      return null
    }
    if (!current) return null

    const summary = buildSummary(current)
    if (!summary) return rowToMemo(current)

    const { data, error } = await supabase
      .from(TABLE)
      .update({ summary })
      .eq('id', id)
      .eq('title', title)
      .eq('content', content)
      .select()
      .maybeSingle<MemoRow>()
    if (error) {
      console.error('Failed to save summary:', error.message)
      return null
    }
    return data ? rowToMemo(data) : null
  }

  try {
    const text = await generateSummary(title, content)
    const memo = await applyToCurrent(() => ({
      text,
      generatedAt: new Date().toISOString(),
      stale: false,
    }))
    return { memo }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : '요약에 실패했습니다.'
    console.warn('Failed to summarize memo:', message)
    const memo = await applyToCurrent(current =>
      current.summary ? { ...current.summary, stale: true } : null
    )
    return { memo, error: memo ? message : undefined }
  }
}
