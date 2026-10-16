import { MemoFont, MEMO_FONTS, DEFAULT_FONT } from '@/types/memo'

// 메모 데이터는 Supabase로 이전됨. 브라우저 취향 값(글꼴)만 LocalStorage에 보관한다.
const FONT_STORAGE_KEY = 'memo-app-font'

export const localStorageUtils = {
  // 뷰어 글꼴 설정 가져오기
  getFont: (): MemoFont => {
    if (typeof window === 'undefined') return DEFAULT_FONT

    try {
      const stored = localStorage.getItem(FONT_STORAGE_KEY)
      return stored && stored in MEMO_FONTS
        ? (stored as MemoFont)
        : DEFAULT_FONT
    } catch (error) {
      console.error('Error loading font from localStorage:', error)
      return DEFAULT_FONT
    }
  },

  // 뷰어 글꼴 설정 저장하기
  saveFont: (font: MemoFont): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(FONT_STORAGE_KEY, font)
    } catch (error) {
      console.error('Error saving font to localStorage:', error)
    }
  },
}
