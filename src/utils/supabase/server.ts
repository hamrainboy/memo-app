import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 서버 액션에서만 사용한다 (환경변수는 NEXT_PUBLIC_ 접두사 없이 서버에만 노출)
export const createSupabaseClient = (): SupabaseClient => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY 환경변수가 설정되지 않았습니다.'
    )
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
