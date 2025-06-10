'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { useEffect, useState } from 'react'

export default function Header() {
  const { email } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <header className="w-full bg-white/80 backdrop-blur border-b border-[#e5e8eb] shadow-sm sticky top-0 z-30">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 py-3">
        {/* 로고 */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/digivault.png" alt="Toss Logo" width={128} height={128} />
        </Link>
        {/* 네비게이션 메뉴 */}
        <nav className="flex gap-6 text-base font-medium">
          <Link href="/" className="text-[#222] hover:text-[#3182f6] transition">홈</Link>
          <Link href="/wallet" className="text-[#222] hover:text-[#3182f6] transition">내 지갑</Link>
          <Link href="/otc" className="text-[#222] hover:text-[#3182f6] transition">OTC 거래</Link>
          <Link href="/settings" className="text-[#222] hover:text-[#3182f6] transition">설정</Link>
        </nav>
        {/* 우측 로그인/유저 영역 */}
        <div>
          {email ? (
            <Link href="/login" className="text-[#3182f6] font-semibold hover:underline transition">{email}님 반갑습니다 👋</Link>
          ) : (
            <Link href="/login" className="text-[#3182f6] font-semibold hover:underline transition">로그인 해주세요</Link>
          )}
        </div>
      </div>
    </header>
  )
}
