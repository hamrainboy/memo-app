'use client'

import { useState, useEffect, useCallback } from 'react'
import { MemoFont, DEFAULT_FONT } from '@/types/memo'
import { localStorageUtils } from '@/utils/localStorage'

export const useMemoFont = () => {
  const [font, setFont] = useState<MemoFont>(DEFAULT_FONT)

  // 초기 로드 (SSR 하이드레이션 불일치 방지를 위해 마운트 후 읽기)
  useEffect(() => {
    setFont(localStorageUtils.getFont())
  }, [])

  const changeFont = useCallback((next: MemoFont) => {
    setFont(next)
    localStorageUtils.saveFont(next)
  }, [])

  return { font, changeFont }
}
