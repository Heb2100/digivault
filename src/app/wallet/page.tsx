'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useWalletStore } from '@/store/useWalletStore'
import ConnectWallet from '@/components/ui/ConnectWallet'
import { isWalletRegistered } from '@/lib/auth'
import { fetchWalletBalances } from '@/lib/wallet'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import jwt from 'jsonwebtoken'

export default function WalletPage() {
  const { address, status } = useAccount()

  const ethBalance = useWalletStore((state) => state.ethBalance)
  const tokenBalances = useWalletStore((state) => state.tokenBalances)
  const setEthBalance = useWalletStore((state) => state.setEthBalance)
  const setTokenBalances = useWalletStore((state) => state.setTokenBalances)
  const { upbitAccessKey, upbitSecretKey, setUpbitKeys } = useWalletStore()
  
  // 실제로는 로그인/입력 등에서 받아온 값을 사용해야 함
  const [upbitBalances, setUpbitBalances] = useState<{ symbol: string; balance: string; locked: string }[]>([])
  const [upbitLoading, setUpbitLoading] = useState(false)
  const [upbitError, setUpbitError] = useState<string | null>(null)

  // 업비트 시세 상태
  const [upbitPrices, setUpbitPrices] = useState<{ [symbol: string]: string }>({})

  // 업비트 지원 마켓 목록을 미리 받아서(최초 1회) 메모리에 저장
  const [upbitMarkets, setUpbitMarkets] = useState<string[]>([]);

  // 바이낸스 시세 상태
  const [binancePrices, setBinancePrices] = useState<{ [symbol: string]: string }>({})

  // 코인베이스 시세 상태
  const [coinbasePrices, setCoinbasePrices] = useState<{ [symbol: string]: string }>({})

  // OKX 시세 상태
  const [okxPrices, setOkxPrices] = useState<{ [symbol: string]: string }>({})

  // 바이낸스 원화 환율 상태
  const [binanceUSDTKRW, setBinanceUSDTKRW] = useState<number | null>(null)

  // 메타마스크 토큰 목록 (ETH + tokenBalances)
  const metamaskTokens = useMemo(() => [
    { symbol: 'ETH', balance: ethBalance },
    ...(tokenBalances || [])
  ], [ethBalance, tokenBalances])

  // 모든 토큰 심볼 집합
  const allSymbols = Array.from(new Set([
    ...metamaskTokens.map(t => t.symbol),
    ...upbitBalances.map(t => t.symbol)
  ]))

  // 토큰별 잔고 매칭
  const getBalance = (arr: { symbol: string; balance: string }[], symbol: string) => arr.find((t: { symbol: string }) => t.symbol === symbol)?.balance || '-'

  // 업비트 잔고 조회 함수 (API 라우트 호출)
  const fetchUpbitBalances = async () => {
    if (!upbitAccessKey || !upbitSecretKey) return;
    setUpbitLoading(true)
    setUpbitError(null)
    try {
      const res = await fetch('/api/upbit-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: upbitAccessKey, secretKey: upbitSecretKey })
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || '업비트 잔고 조회 실패')
      setUpbitBalances(result.balances)
    } catch (err: any) {
      setUpbitError(err.message || '업비트 잔고 조회 실패')
      setUpbitBalances([])
      console.error('업비트 API 에러:', err)
    } finally {
      setUpbitLoading(false)
    }
  }

  // 업비트 시세 조회 함수
    const fetchUpbitPrices = async () => {
      try {
        // 잔고 토큰 + 마켓 목록 기반 유효한 심볼만 필터
        const symbols = allSymbols
          .filter((s) => s !== '-' && upbitMarkets.includes(s.toUpperCase()))
          .map((s) => s.toUpperCase())
    
        if (symbols.length === 0) return
        console.log('⛳ symbols for upbit-price:', symbols)
    
        const res = await fetch('/api/upbit-price', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbols }),
        })
    
        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.message || '업비트 시세 조회 실패')
        }
    
        const data = await res.json()
    
        const priceMap: { [symbol: string]: string } = {}
        for (const item of data) {
          const symbol = item.market.replace('KRW-', '')
          const price = item.trade_price
          priceMap[symbol] = price.toLocaleString() + ' KRW'
        }
    
        setUpbitPrices(priceMap)
      } catch (err: any) {
        console.error('업비트 시세 조회 에러:', err)
        setUpbitPrices({})
      }
    }

  // 바이낸스 시세 조회 함수 (API 라우트 호출, 원화 환산)
  const fetchBinancePrices = async () => {
    try {
      // 업비트 잔고에 있는 토큰만 대상으로
      const symbols = upbitBalances.map(t => t.symbol.toUpperCase()).filter(s => s !== '-')
      
      // USDT/KRW 환율도 백엔드에서 조회
      const res = await fetch('/api/binance-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          symbols,
          includeUsdtKrw: true // USDT/KRW 환율도 함께 요청
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || '바이낸스 시세 조회 실패')
      }
      
      const result = await res.json()
      setBinanceUSDTKRW(result.usdtKrw)
      setBinancePrices(result.prices || {})
    } catch (err: any) {
      console.error('바이낸스 시세 조회 에러:', err)
      setBinancePrices({})
    }
  }

  // 코인베이스 시세 조회 함수
  const fetchCoinbasePrices = async () => {
    try {
      const symbols = upbitBalances.map(t => t.symbol.toUpperCase()).filter(s => s !== '-')
      const res = await fetch('/api/coinbase-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      })
      const result = await res.json()
      setCoinbasePrices(result.prices || {})
    } catch (err) {
      setCoinbasePrices({})
    }
  }

  // OKX 시세 조회 함수
  const fetchOkxPrices = async () => {
    try {
      const symbols = upbitBalances.map(t => t.symbol.toUpperCase()).filter(s => s !== '-')
      const res = await fetch('/api/okx-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      })
      const result = await res.json()
      setOkxPrices(result.prices || {})
    } catch (err) {
      setOkxPrices({})
    }
  }

  // 에러 상태 관리 추가
  const [walletError, setWalletError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log('업비트 키:', upbitAccessKey, upbitSecretKey)
    if (upbitAccessKey && upbitSecretKey) {
      fetchUpbitBalances();
    }
  }, [upbitAccessKey, upbitSecretKey]);

  useEffect(() => {
    const handleWallet = async () => {
      if (status === 'connected' && address) {  
        setIsLoading(true)
        setWalletError(null)
        try {
          const isRegistered = await isWalletRegistered(address)
          if (!isRegistered) {
            setWalletError('등록되지 않은 지갑입니다. 먼저 회원가입을 진행해주세요.')
            return
          }
  
          const { eth, tokens } = await fetchWalletBalances(address)
          setEthBalance(eth)
          setTokenBalances(tokens)
        } catch (err: any) {
          setWalletError(err.message || '지갑 잔고 조회 중 오류가 발생했습니다.')
          console.error('지갑 에러:', err)
        } finally {
          setIsLoading(false)
        }
      }
    }
    handleWallet()
  }, [status, address])

  // 새로고침 시 localStorage에서 업비트 키 복원
  useEffect(() => {
    if (!upbitAccessKey || !upbitSecretKey) {
      const raw = localStorage.getItem('wallet-storage')
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          const accessKey = parsed?.state?.upbitAccessKey || ''
          const secretKey = parsed?.state?.upbitSecretKey || ''
          if (accessKey && secretKey) setUpbitKeys?.(accessKey, secretKey)
        } catch {}
      }
    }
  }, [])

  useEffect(() => {
    fetch('/api/upbit-markets')
      .then(res => res.json())
      .then(data => {
        if (data.markets) {
          setUpbitMarkets(data.markets.filter((m: string) => m.startsWith('KRW-')).map((m: string) => m.replace('KRW-', '')));
        }
      })
      .catch(err => {
        console.error('업비트 마켓 목록 조회 에러:', err)
        setUpbitMarkets([])
      });
  }, []);

  useEffect(() => {
    fetchUpbitPrices()
    fetchBinancePrices()
    fetchCoinbasePrices()
    fetchOkxPrices()
    // eslint-disable-next-line
  }, [allSymbols.join(',')])

  // 업비트 잔고에서 사용 가능한 금액 계산 (locked 금액 제외)
  const getAvailableBalance = (symbol: string) => {
    const balance = upbitBalances.find(b => b.symbol === symbol)
    if (!balance) return null
    const locked = parseFloat(balance.locked || '0')
    const total = parseFloat(balance.balance)
    return total - locked
  }

  return (
    <div className="p-4">
      {/* 에러 메시지 표시 */}
      {(walletError || upbitError) && (
        <div className="max-w-5xl mx-auto mb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {walletError && <p className="mb-2">{walletError}</p>}
            {upbitError && <p>{upbitError}</p>}
          </div>
        </div>
      )}

      {/* 로딩 상태 표시 */}
      {(isLoading || upbitLoading) && (
        <div className="max-w-5xl mx-auto mb-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            데이터를 불러오는 중입니다...
          </div>
        </div>
      )}

      {/* 통합 잔고 표 */}
      <div className="bg-white rounded-2xl shadow p-6 max-w-5xl mx-auto">
        <table className="w-full border-separate border-spacing-0 text-center">
          <thead>
            <tr className="bg-[#f9fbfd]">
              <th className="py-3 px-4 border-b font-semibold text-[#222]">토큰</th>
              {status === 'connected' && (
                <th className="py-3 px-4 border-b font-semibold text-[#222]">🦊 메타마스크 지갑잔고</th>
              )}
              <th className="py-3 px-4 border-b font-semibold text-[#222]">🟢 업비트 지갑잔고</th>
              <th className="py-3 px-4 border-b font-semibold text-[#222]">🟡 바이낸스 시세</th>
              <th className="py-3 px-4 border-b font-semibold text-[#222]">🔵 코인베이스 시세</th>
              <th className="py-3 px-4 border-b font-semibold text-[#222]">🟣 OKX 시세</th>
            </tr>
          </thead>
          <tbody>
            {[...allSymbols]
              .sort((a, b) => {
                const priceA = Number(upbitPrices[a]?.replace(/[^\d.]/g, '') || 0)
                const priceB = Number(upbitPrices[b]?.replace(/[^\d.]/g, '') || 0)
                return priceB - priceA // 비싼 순서 (내림차순)
              })
              .filter(symbol => {
                const upbitBalanceInfo = upbitBalances.find(b => b.symbol === symbol)
                const balNum = Number(upbitBalanceInfo?.balance || '0')
                const hasUpbitBalance = balNum > 0
                return hasUpbitBalance
              })
              .map((symbol: string) => (
              <tr key={symbol} className="border-b">
                <td className="py-3 px-4 font-medium">{symbol}</td>
                {status === 'connected' && (
                  <td className="py-3 px-4">
                    {getBalance(metamaskTokens, symbol)}
                  </td>
                )}
                <td className="py-3 px-4">
                  {(() => {
                    const upbitBal = getBalance(upbitBalances, symbol)
                    const availableBal = getAvailableBalance(symbol)
                    return (
                      <>
                        {upbitBal && upbitBal !== '-' ? (
                          <>
                            <div>{upbitBal}</div>
                            {availableBal !== null && availableBal !== parseFloat(upbitBal) && (
                              <div className="text-xs text-gray-500">
                                (사용가능: {availableBal.toFixed(8)})
                              </div>
                            )}
                          </>
                        ) : '-'}
                        {upbitPrices[symbol] && (
                          <div className="text-xs text-gray-500 mt-1">{upbitPrices[symbol]}</div>
                        )}
                      </>
                    )
                  })()}
                </td>
                <td className="py-3 px-4">
                  {(() => {
                    const upbitBal = getBalance(upbitBalances, symbol)
                    const binancePrice = binancePrices[symbol] ? parseFloat(binancePrices[symbol].replace(/[^\d.]/g, '')) : null
                    const upbitPrice = upbitPrices[symbol] ? parseFloat(upbitPrices[symbol].replace(/[^\d.]/g, '')) : null
                    const balNum = upbitBal && upbitBal !== '-' ? parseFloat(upbitBal) : null
                    let diff = null
                    if (binancePrice && upbitPrice && balNum) {
                      // (바이낸스시세 - 업비트시세) * 개수
                      diff = Math.round((binancePrice - upbitPrice) * balNum)
                    }
                    return (
                      <>
                        {diff !== null && (
                          <div className={`text-xs mb-1 ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ({diff >= 0 ? '+' : ''}{diff.toLocaleString()} KRW)
                          </div>
                        )}
                        {binancePrices[symbol] && (
                          <div className="text-xs text-gray-500">{binancePrices[symbol]}</div>
                        )}
                      </>
                    )
                  })()}
                </td>
                <td className="py-3 px-4">
                  {(() => {
                    const upbitBal = getBalance(upbitBalances, symbol)
                    const coinbasePrice = coinbasePrices[symbol] ? parseFloat(coinbasePrices[symbol].replace(/[^\d.]/g, '')) : null
                    const upbitPrice = upbitPrices[symbol] ? parseFloat(upbitPrices[symbol].replace(/[^\d.]/g, '')) : null
                    const balNum = upbitBal && upbitBal !== '-' ? parseFloat(upbitBal) : null
                    let diff = null
                    if (coinbasePrice && upbitPrice && balNum) {
                      // (코인베이스시세 - 업비트시세) * 개수
                      diff = Math.round((coinbasePrice - upbitPrice) * balNum)
                    }
                    return (
                      <>
                        {diff !== null && (
                          <div className={`text-xs mb-1 ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ({diff >= 0 ? '+' : ''}{diff.toLocaleString()} KRW)
                          </div>
                        )}
                        {coinbasePrices[symbol] && (
                          <div className="text-xs text-gray-500">{coinbasePrices[symbol]}</div>
                        )}
                      </>
                    )
                  })()}
                </td>
                <td className="py-3 px-4">
                  {(() => {
                    const upbitBal = getBalance(upbitBalances, symbol)
                    const okxPrice = okxPrices[symbol] ? parseFloat(okxPrices[symbol].replace(/[^\d.]/g, '')) : null
                    const upbitPrice = upbitPrices[symbol] ? parseFloat(upbitPrices[symbol].replace(/[^\d.]/g, '')) : null
                    const balNum = upbitBal && upbitBal !== '-' ? parseFloat(upbitBal) : null
                    let diff = null
                    if (okxPrice && upbitPrice && balNum) {
                      // (OKX시세 - 업비트시세) * 개수
                      diff = Math.round((okxPrice - upbitPrice) * balNum)
                    }
                    return (
                      <>
                        {diff !== null && (
                          <div className={`text-xs mb-1 ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ({diff >= 0 ? '+' : ''}{diff.toLocaleString()} KRW)
                          </div>
                        )}
                        {okxPrices[symbol] && (
                          <div className="text-xs text-gray-500">{okxPrices[symbol]}</div>
                        )}
                      </>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 지갑 연결/해제 버튼 */}
      <div className="mt-8 flex justify-center">
        <ConnectWallet />
      </div>
    </div>
  )
}
