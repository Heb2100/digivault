// src/lib/auth.ts
// import { supabase } from './supabaseClient' // Old import
import { createSupabaseClient } from './supabaseClient' // New import
import bcrypt from 'bcryptjs'
import { useAuthStore } from '@/store/useAuthStore'


// 회원가입
export async function signUpWithEmail(email: string, password: string) {
  const password_hash = await bcrypt.hash(password, 10)
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.from('users').insert([
    {
      email,
      password_hash,
    },
  ])

  if (error) throw error
  return data
}

// 로그인
export async function loginWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, password_hash')
    .eq('email', email)
    .single()

  if (error || !data) throw new Error('유저 없음 또는 쿼리 실패')

  const isValid = await bcrypt.compare(password, data.password_hash)
  if (!isValid) throw new Error('❌ 비밀번호 틀림')

  useAuthStore.getState().setEmail(email)

  return data // 로그인 성공 시 사용자 정보 리턴
}

// 지갑 등록 여부 확인 (wallets 테이블 기준으로)
export async function isWalletRegistered(address: string): Promise<boolean> {
  const supabase = createSupabaseClient()
  const { data, error } = await supabase
    .from('wallets')
    .select('id')
    .eq('address', address)
    .single()

  return !!data && !error
}
