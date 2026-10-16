'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Memo, MemoFont, MEMO_CATEGORIES, MEMO_FONTS } from '@/types/memo'
import { useMemoFont } from '@/hooks/useMemoFont'
import { formatMemoDate, getCategoryColor } from '@/utils/memoFormat'

// Tailwind가 클래스를 감지할 수 있도록 전체 클래스명을 리터럴로 작성
const FONT_CLASSES: Record<MemoFont, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
}

// 마크다운 렌더러는 자체 font-family를 가지므로 important로 덮어씀
const PREVIEW_FONT_CLASSES: Record<MemoFont, string> = {
  sans: '!font-sans',
  serif: '!font-serif',
  mono: '!font-mono',
}

// 마크다운 렌더러만 클라이언트에서 지연 로드
const MarkdownPreview = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false }
)

interface MemoViewerProps {
  memo: Memo | null
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  onSummarize: (id: string) => void
  isSummarizing: boolean
  summaryError?: string
}

export default function MemoViewer({
  memo,
  onClose,
  onEdit,
  onDelete,
  onSummarize,
  isSummarizing,
  summaryError,
}: MemoViewerProps) {
  const isOpen = memo !== null
  const { font, changeFont } = useMemoFont()

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!memo) return null

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      data-testid="memo-viewer-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-viewer-title"
        className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${FONT_CLASSES[font]}`}
        onClick={e => e.stopPropagation()}
        data-testid="memo-viewer"
      >
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1 min-w-0">
              <h2
                id="memo-viewer-title"
                className="text-xl font-semibold text-gray-900 mb-2 break-words"
              >
                {memo.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(memo.category)}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
                <span className="text-xs text-gray-500">
                  수정: {formatMemoDate(memo.updatedAt)}
                </span>
                <span className="text-xs text-gray-500">
                  작성: {formatMemoDate(memo.createdAt)}
                </span>
              </div>
            </div>
            <select
              value={font}
              onChange={e => changeFont(e.target.value as MemoFont)}
              aria-label="글꼴 선택"
              title="글꼴 선택"
              className="ml-4 px-2 py-1 text-sm text-gray-700 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="memo-viewer-font-select"
            >
              {(Object.keys(MEMO_FONTS) as MemoFont[]).map(key => (
                <option key={key} value={key}>
                  {MEMO_FONTS[key]}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              aria-label="닫기"
              title="닫기"
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              data-testid="memo-viewer-close-btn"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 내용 */}
          <div
            data-color-mode="light"
            className="mb-4 text-sm break-words"
            data-testid="memo-viewer-content"
          >
            <MarkdownPreview
              source={memo.content}
              className={`!bg-transparent !text-gray-700 ${PREVIEW_FONT_CLASSES[font]}`}
            />
          </div>

          {/* AI 요약 */}
          <div
            className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg"
            role="status"
            aria-live="polite"
            data-testid="memo-viewer-summary"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-blue-700">
                  AI 요약
                </span>
                {memo.summary?.stale && (
                  <span
                    className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full"
                    data-testid="memo-viewer-summary-stale"
                  >
                    오래된 요약
                  </span>
                )}
                {isSummarizing && memo.summary && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    갱신 중 (AI 응답이 느리면 1분 이상 걸릴 수 있습니다)
                  </span>
                )}
              </div>
              {(!memo.summary || memo.summary.stale || summaryError) && (
                <button
                  onClick={() => onSummarize(memo.id)}
                  disabled={isSummarizing || !memo.content.trim()}
                  className="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-300 bg-white hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="memo-viewer-summary-btn"
                >
                  {isSummarizing
                    ? '요약 중...'
                    : memo.summary || summaryError
                      ? '다시 시도'
                      : 'AI 요약'}
                </button>
              )}
            </div>
            {memo.summary ? (
              <>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {memo.summary.text}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  요약: {formatMemoDate(memo.summary.generatedAt)}
                </p>
              </>
            ) : (
              !summaryError && (
                <p className="text-sm text-gray-500">
                  {isSummarizing
                    ? '메모를 요약하는 중입니다... (AI 응답이 느리면 1분 이상 걸릴 수 있습니다)'
                    : 'AI로 메모를 짧게 요약할 수 있습니다.'}
                </p>
              )
            )}
            {summaryError && (
              <p
                className="mt-1 text-sm text-red-600"
                data-testid="memo-viewer-summary-error"
              >
                {summaryError}
              </p>
            )}
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {memo.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDelete}
              aria-label="메모 삭제"
              className="flex-1 px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              data-testid="memo-viewer-delete-btn"
            >
              삭제
            </button>
            <button
              onClick={() => onEdit(memo)}
              aria-label="메모 편집"
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              data-testid="memo-viewer-edit-btn"
            >
              편집
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
