'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabaseClient'
import { loginWithEmail } from '@/lib/auth'
import { useAuthStore } from '@/store/useAuthStore'
import Image from 'next/image'
import { useWalletStore } from '@/store/useWalletStore'

export default function LoginPage() {
  const { address, isConnected, status } = useAccount()
  const [mounted, setMounted] = useState(false)
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  })
  const { disconnect } = useDisconnect()
  const router = useRouter()

  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  // 업비트 모달 상태 및 입력값
  const [showUpbitModal, setShowUpbitModal] = useState(false)
  const { upbitAccessKey, upbitSecretKey, setUpbitKeys } = useWalletStore()

  // 현재 로그인된 사용자 이메일 가져오기
  const email = useAuthStore((state) => state.email)

  const [tempUpbitAccessKey, setTempUpbitAccessKey] = useState('')
  const [tempUpbitSecretKey, setTempUpbitSecretKey] = useState('')  

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
  
    const mergeWalletToEmail = async () => {
      const supabase = createSupabaseClient()
      const email = useAuthStore.getState().email
      if (!isConnected || !address || !email) return
  
      // 1. 유저 ID 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
  
      if (userError || !userData) {
        console.error('💥 유저 조회 실패:', userError)
        return
      }
  
      const user_id = userData.id
  
      // 2. 이미 지갑 등록돼 있는지 확인
      const { data: existingWallets, error: checkError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', user_id)
        .eq('provider', 'metamask')
        .eq('address', address)
  
      if (checkError) {
        console.error('💥 지갑 확인 실패:', checkError)
        return
      }
  
      if (existingWallets && existingWallets.length > 0) {
        console.log('✅ 이미 등록된 지갑입니다')
        return
      }
  
      // 3. 지갑 등록
      const { error: insertError } = await supabase.from('wallets').insert({
        user_id,
        provider: 'metamask',
        address,
      })
  
      if (insertError) {
        console.error('💥 지갑 등록 실패:', insertError)
      } else {
        console.log('✅ 지갑 병합 성공!')
      }
    }
  
    mergeWalletToEmail()
  }, [isConnected, address, mounted])
  
  // 업비트 키 상태 초기화
  useEffect(() => {
    if (!upbitAccessKey || !upbitSecretKey) {
      const raw = localStorage.getItem('wallet-storage')
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          const accessKey = parsed?.state?.upbitAccessKey || ''
          const secretKey = parsed?.state?.upbitSecretKey || ''
          if (accessKey && secretKey && setUpbitKeys) {
            setUpbitKeys(accessKey, secretKey)
          }
        } catch {}
      }
    }
  }, [])

  // 업비트 키 유효성 검사
  const isUpbitConnected = Boolean(
    typeof upbitAccessKey === 'string' && 
    typeof upbitSecretKey === 'string' && 
    upbitAccessKey.length > 0 && 
    upbitSecretKey.length > 0
  )

  const handleIdLogin = async () => {
    try {
      setErrorMsg('')
      const user = await loginWithEmail(id, password)
      useAuthStore.getState().setEmail(id)
      console.log('✅ 로그인 성공:', user)
      router.push('/')
    } catch (err: any) {
      setErrorMsg(err.message)
    }
  }

  if (status === 'connecting') {
    return <p>🔄 지갑 상태 확인 중...</p>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fbfd] px-4">
      {/* 업비트 연동 모달 */}
      {showUpbitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-96">
            <h3 className="text-lg font-bold mb-4">업비트 API 키 입력</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Key</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={tempUpbitAccessKey}
                  onChange={e => setTempUpbitAccessKey(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                <input
                  type="password"
                  className="border rounded px-3 py-2 w-full"
                  value={tempUpbitSecretKey}
                  onChange={e => setTempUpbitSecretKey(e.target.value)}
                />
              </div>
              <button
                className="w-full bg-[#3182f6] hover:bg-[#2563c6] text-white py-2 rounded-xl font-bold transition"
                onClick={() => {
                  if (setUpbitKeys && tempUpbitAccessKey && tempUpbitSecretKey) {
                    setUpbitKeys(tempUpbitAccessKey, tempUpbitSecretKey)
                    setTempUpbitAccessKey('')
                    setTempUpbitSecretKey('')
                    setShowUpbitModal(false)
                    router.push('/wallet')
                  }
                }}
              >
                연결하기
              </button>
              <button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl font-bold transition"
                onClick={() => {
                  setShowUpbitModal(false)
                  setTempUpbitAccessKey('')
                  setTempUpbitSecretKey('')
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 로고 */}
      <div className="mb-10 flex flex-col items-center">
        <Image src="/digivault.png" alt="digivault Logo" width={180} height={48} />
        {!email && (
          <>
            <h1 className="text-2xl font-bold mt-4 text-[#222]">로그인</h1>
            <p className="text-[#666] mt-2 text-base">간편하게 시작해보세요</p>
          </>
        )}
      </div>

      {/* 로그인 카드 */}
      <div className="bg-white rounded-2xl shadow-md w-full max-w-sm p-8 mb-6">
        {email ? (
          // 로그인된 상태
          <div className="text-center">
            <p className="text-lg font-medium text-[#222] mb-2">
              {email.split('@')[0]}님, 반갑습니다
            </p>
            <p className="text-sm text-[#666] mb-4">
              현재 로그인되어 있습니다
            </p>
            <button
              onClick={() => {
                useAuthStore.getState().setEmail('')
                router.push('/')
              }}
              className="w-full bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#222] py-3 rounded-xl font-bold transition"
            >
              로그아웃
            </button>
          </div>
        ) : (
          // 로그인되지 않은 상태
          <div className="space-y-4">
            <input
              type="email"
              placeholder="이메일"
              className="w-full border border-[#e5e8eb] focus:border-[#3182f6] px-4 py-3 rounded-xl outline-none transition"
              value={id}
              onChange={(e) => setId(e.target.value)}
            />
            <input
              type="password"
              placeholder="비밀번호"
              className="w-full border border-[#e5e8eb] focus:border-[#3182f6] px-4 py-3 rounded-xl outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
            <button
              onClick={handleIdLogin}
              className="w-full bg-[#3182f6] hover:bg-[#2563c6] text-white py-3 rounded-xl font-bold transition"
            >
              이메일로 로그인
            </button>
            <div className="mt-6 text-center">
              <span className="text-[#b0b8c1] text-sm">아직 계정이 없으신가요?</span>
              <button
                onClick={() => router.push('/register')}
                className="ml-2 text-[#3182f6] hover:underline text-sm font-medium"
              >
                회원가입 하러가기 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 소셜/지갑 로그인 */}
      <div className="w-full max-w-xl">
        {!email ? (
          // 이메일 로그인되지 않은 상태
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-[#e5e8eb]" />
              <span className="mx-4 text-[#b0b8c1] text-sm">또는</span>
              <div className="flex-1 h-px bg-[#e5e8eb]" />
            </div>
            <div className="space-y-3">
              {isConnected ? (
                <div className="flex flex-col items-center space-y-2">
                  <p className="text-[#222]">🦊 연결됨: {address}</p>
                  <button
                    onClick={() => disconnect()}
                    className="w-full bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#222] py-3 rounded-xl font-bold transition"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => connect()}
                    className="w-full bg-[#fffbe7] hover:bg-[#fff3bf] text-[#222] py-3 rounded-xl font-bold border border-[#ffe066] transition"
                  >
                    🦊 메타마스크로 로그인
                  </button>
                  <button
                    onClick={() => setShowUpbitModal(true)}
                    className="w-full bg-[#fffbe7] hover:bg-[#fff3bf] text-[#222] py-3 rounded-xl font-bold border border-[#ffe066] transition"
                  >
                    🟢 업비트로 로그인
                  </button>
                  <button
                    onClick={() => alert('바이낸스 로그인 준비 중입니다')}
                    className="w-full bg-[#fffbe7] hover:bg-[#fff3bf] text-[#f6c700] py-3 rounded-xl font-bold border border-[#ffe066] transition"
                  >
                    🟡 바이낸스로 로그인
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          // 이메일 로그인된 상태
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* 메타마스크 지갑 */}
              {isConnected ? (
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#fffbe7] rounded-full flex items-center justify-center">
                        <span className="text-xl">🦊</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#222]">메타마스크 지갑</p>
                        <p className="text-sm text-[#666]">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        연결됨
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => disconnect()}
                    className="w-full bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#222] py-3 rounded-xl font-bold transition"
                  >
                    지갑 연결 해제
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#f2f4f6] rounded-full flex items-center justify-center">
                        <span className="text-xl">🦊</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#222]">메타마스크 지갑</p>
                        <p className="text-sm text-[#666]">연결되지 않음</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => connect()}
                    className="w-full bg-[#fffbe7] hover:bg-[#fff3bf] text-[#222] py-3 rounded-xl font-bold border border-[#ffe066] transition"
                  >
                    지갑 연결하기
                  </button>
                </div>
              )}

              {/* 업비트 지갑 */}
              {isUpbitConnected && upbitAccessKey ? (
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#fffbe7] rounded-full flex items-center justify-center">
                        <span className="text-xl">🟢</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#222]">업비트 지갑</p>
                        <p className="text-sm text-[#666]">
                          {upbitAccessKey.slice(0, 6)}...{upbitAccessKey.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        연결됨
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (setUpbitKeys) {
                        setUpbitKeys('', '')
                        localStorage.removeItem('wallet-storage')
                      }
                    }}
                    className="w-full bg-[#f2f4f6] hover:bg-[#e5e8eb] text-[#222] py-3 rounded-xl font-bold transition"
                  >
                    지갑 연결 해제
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#f2f4f6] rounded-full flex items-center justify-center">
                        <span className="text-xl">🟢</span>
                      </div>
                      <div>
                        <p className="font-medium text-[#222]">업비트 지갑</p>
                        <p className="text-sm text-[#666]">연결되지 않음</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUpbitModal(true)}
                    className="w-full bg-[#fffbe7] hover:bg-[#fff3bf] text-[#222] py-3 rounded-xl font-bold border border-[#ffe066] transition"
                  >
                    지갑 연결하기
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
