'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Memo, MemoFormData } from '@/types/memo'
import * as memoActions from '@/app/actions/memoActions'

const withoutKey = (
  record: Record<string, string>,
  key: string
): Record<string, string> => {
  if (!(key in record)) return record
  return Object.fromEntries(Object.entries(record).filter(([k]) => k !== key))
}

const toMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback

export const useMemos = () => {
  const [memos, setMemos] = useState<Memo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [summarizingIds, setSummarizingIds] = useState<string[]>([])
  const [summaryErrors, setSummaryErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const dismissError = useCallback(() => setError(null), [])

  // 메모 로드
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        setMemos(await memoActions.getMemos())
      } catch (err) {
        console.error('Failed to load memos:', err)
        setError(toMessage(err, '메모를 불러오지 못했습니다.'))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  // 메모 생성
  const createMemo = useCallback(
    async (formData: MemoFormData): Promise<void> => {
      try {
        const newMemo = await memoActions.createMemo(formData)
        setMemos(prev => [newMemo, ...prev])
      } catch (err) {
        console.error('Failed to create memo:', err)
        setError(toMessage(err, '메모를 저장하지 못했습니다.'))
      }
    },
    []
  )

  // 요약 실행 (snapshot 기준으로 요청하고, 서버가 본문이 같을 때만 저장/반환)
  const runSummary = useCallback(async (snapshot: Memo): Promise<void> => {
    const { id, title, content } = snapshot

    setSummarizingIds(prev => [...prev, id])
    setSummaryErrors(prev => withoutKey(prev, id))

    try {
      const { memo: next, error: message } = await memoActions.summarizeMemo(
        id,
        title,
        content
      )
      if (next) {
        setMemos(prev => prev.map(memo => (memo.id === id ? next : memo)))
      }
      if (message) {
        setSummaryErrors(prev => ({ ...prev, [id]: message }))
      }
    } catch (err) {
      // 사용자에게 안내되는 예상 가능한 실패이므로 개발 오버레이를 띄우지 않도록 warn 사용
      console.warn('Failed to summarize memo:', err)
      setSummaryErrors(prev => ({
        ...prev,
        [id]: '네트워크 오류로 요약에 실패했습니다.',
      }))
    } finally {
      setSummarizingIds(prev => {
        const index = prev.indexOf(id)
        return index === -1 ? prev : prev.filter((_, i) => i !== index)
      })
    }
  }, [])

  // 메모 요약 (버튼/재시도)
  const summarizeMemo = useCallback(
    (id: string): void => {
      const target = memos.find(memo => memo.id === id)
      if (!target) return
      void runSummary(target)
    },
    [memos, runSummary]
  )

  // 메모 업데이트
  const updateMemo = useCallback(
    async (id: string, formData: MemoFormData): Promise<void> => {
      const existingMemo = memos.find(memo => memo.id === id)
      if (!existingMemo) return

      try {
        const updatedMemo = await memoActions.updateMemo(id, formData)
        if (!updatedMemo) return
        setMemos(prev =>
          prev.map(memo => (memo.id === id ? updatedMemo : memo))
        )

        // 이미 요약된 메모의 제목/본문이 바뀌면 자동 재요약 (저장과는 별개로 진행)
        const contentChanged =
          existingMemo.title !== updatedMemo.title ||
          existingMemo.content !== updatedMemo.content
        if (existingMemo.summary && contentChanged) {
          void runSummary(updatedMemo)
        }
      } catch (err) {
        console.error('Failed to update memo:', err)
        setError(toMessage(err, '메모를 수정하지 못했습니다.'))
      }
    },
    [memos, runSummary]
  )

  // 메모 삭제
  const deleteMemo = useCallback(async (id: string): Promise<void> => {
    try {
      await memoActions.deleteMemo(id)
      setMemos(prev => prev.filter(memo => memo.id !== id))
      setSummaryErrors(prev => withoutKey(prev, id))
    } catch (err) {
      console.error('Failed to delete memo:', err)
      setError(toMessage(err, '메모를 삭제하지 못했습니다.'))
    }
  }, [])

  // 메모 검색
  const searchMemos = useCallback((query: string): void => {
    setSearchQuery(query)
  }, [])

  // 카테고리 필터링
  const filterByCategory = useCallback((category: string): void => {
    setSelectedCategory(category)
  }, [])

  // 특정 메모 가져오기
  const getMemoById = useCallback(
    (id: string): Memo | undefined => {
      return memos.find(memo => memo.id === id)
    },
    [memos]
  )

  // 필터링된 메모 목록
  const filteredMemos = useMemo(() => {
    let filtered = memos

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memo => memo.category === selectedCategory)
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        memo =>
          memo.title.toLowerCase().includes(query) ||
          memo.content.toLowerCase().includes(query) ||
          memo.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [memos, selectedCategory, searchQuery])

  // 통계 정보
  const stats = useMemo(() => {
    const totalMemos = memos.length
    const categoryCounts = memos.reduce(
      (acc, memo) => {
        acc[memo.category] = (acc[memo.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    return {
      total: totalMemos,
      byCategory: categoryCounts,
      filtered: filteredMemos.length,
    }
  }, [memos, filteredMemos])

  return {
    // 상태
    memos: filteredMemos,
    allMemos: memos,
    loading,
    searchQuery,
    selectedCategory,
    stats,
    summarizingIds,
    summaryErrors,
    error,

    // 메모 CRUD
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,

    // AI 요약
    summarizeMemo,

    // 필터링 & 검색
    searchMemos,
    filterByCategory,

    // 유틸리티
    dismissError,
  }
}
