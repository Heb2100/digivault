// src/app/register/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpWithEmail } from '@/lib/auth'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    try {
      setError('')
      const data = await signUpWithEmail(email, password)
      setSuccess(true)
      console.log('✅ 회원가입 성공:', data)
      router.push('/login')
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold mb-6">📝 회원가입</h1>

      <input
        type="email"
        value={email}
        placeholder="이메일"
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded mb-3 w-64"
      />

      <input
        type="password"
        value={password}
        placeholder="비밀번호"
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded mb-3 w-64"
      />

      <button
        onClick={handleRegister}
        className="bg-blue-600 text-white px-4 py-2 rounded w-64"
      >
        회원가입
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}
      {success && <p className="text-green-500 mt-4">회원가입 완료! 로그인 페이지로 이동 중...</p>}
    </div>
  )
}
