'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { ethers } from 'ethers'
import { createSupabaseClient } from '@/lib/supabaseClient'
import { useWalletStore } from '@/store/useWalletStore'

declare global {
  interface Window {
    ethereum?: any
  }
}

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]

const TOKEN_CONTRACTS = [
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606EB48' },
  { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  { symbol: 'SHIB', address: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' },
  { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
]

export default function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect({
    connector: new InjectedConnector({ options: { shimDisconnect: true } }),
  })
  const { disconnect } = useDisconnect()

  // ✅ Zustand 상태 setter 가져오기
  const setEthBalance = useWalletStore((state) => state.setEthBalance)
  const setTokenBalances = useWalletStore((state) => state.setTokenBalances)

  const [ethBalance, setLocalEthBalance] = useState<string>('')
  const [tokenBalances, setLocalTokenBalances] = useState<{ symbol: string; balance: string }[]>([])

  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !address || !window.ethereum) return

      const provider = new ethers.providers.Web3Provider(window.ethereum)

      // ETH 잔액
      const eth = await provider.getBalance(address)
      const formattedEth = ethers.utils.formatEther(eth)
      setLocalEthBalance(formattedEth)
      setEthBalance(formattedEth) // ✅ Zustand 저장

      // ERC-20 토큰 잔액
      const balances = await Promise.all(
        TOKEN_CONTRACTS.map(async ({ symbol, address: tokenAddress }) => {
          try {
            const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
            const balance = await contract.balanceOf(address)
            const decimals = await contract.decimals()
            const formatted = ethers.utils.formatUnits(balance, decimals)
            return { symbol, balance: formatted }
          } catch (err) {
            return { symbol, balance: '조회 실패' }
          }
        })
      )

      setLocalTokenBalances(balances)
      setTokenBalances(balances) // ✅ Zustand 저장
    }

    fetchBalances()
  }, [isConnected, address])

  return (
    <div>
      {isConnected ? (
        <>
          <p>🦊 지갑 주소: {address}</p>
          <p>💰 ETH 잔액: {ethBalance} ETH</p>
          <div>
            <h3 className="mt-4 font-bold">📦 토큰 잔액</h3>
            <ul>
              {tokenBalances.map((token) => (
                <li key={token.symbol}>
                  {token.symbol}: {token.balance}
                </li>
              ))}
            </ul>
          </div>
          <button className="mt-4" onClick={() => disconnect()}>
            로그아웃
          </button>
        </>
      ) : (
        <button
          onClick={() => {
            disconnect()
            connect()
          }}
        >
          지갑 연결
        </button>
      )}
    </div>
  )
}

export function useLogin() {
  const { address, isConnected } = useAccount()
  // Initialize Supabase client within the hook
  const supabase = useMemo(() => createSupabaseClient(), []);

  useEffect(() => {
    const login = async () => {
      if (!isConnected || !address) return

      // ✅ Supabase 세션에서 현재 로그인된 유저 정보 가져오기
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user?.email) {
        console.error('유저 세션 가져오기 실패:', userError)
        return
      }

      const email = user.email

      // ✅ users 테이블에서 ID 가져오기
      const { data: userData, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (selectError || !userData) {
        console.error('유저 조회 실패:', selectError)
        return
      }

      const user_id = userData.id

      // ✅ 이미 등록된 지갑인지 확인
      const { data: existingWallets } = await supabase
        .from('wallets')
        .select()
        .eq('user_id', user_id)
        .eq('address', address)
        .eq('provider', 'metamask')

      if (!existingWallets || existingWallets.length === 0) {
        const { error: walletError } = await supabase.from('wallets').insert({
          user_id,
          provider: 'metamask',
          address,
        })

        if (walletError) console.error('지갑 등록 실패:', walletError)
        else console.log('✅ 메타마스크 지갑 등록 완료!')
      } else {
        console.log('✅ 이미 등록된 메타마스크 지갑입니다')
      }
    }

    login()
  }, [isConnected, address])
}