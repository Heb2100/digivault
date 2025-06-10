import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import CryptoJS from 'crypto-js'
import jwt from 'jsonwebtoken'

export async function POST(req: NextRequest) {
  const { accessKey, secretKey } = await req.json()
  if (!accessKey || !secretKey) {
    return NextResponse.json({ error: 'Missing keys' }, { status: 400 })
  }
  try {
    const serverUrl = 'https://api.upbit.com'
    const endpoint = '/v1/accounts'
    const nonce = Date.now().toString()
    const payload = { access_key: accessKey, nonce }
    const query = new URLSearchParams(payload).toString()
    const hash = CryptoJS.SHA512(query).toString(CryptoJS.enc.Hex)
    const token = jwt.sign(
      {
        access_key: accessKey,
        nonce,
        query_hash: hash,
        query_hash_alg: 'SHA512',
      },
      secretKey
    )
    const headers = { Authorization: `Bearer ${token}` }
    const { data } = await axios.get(serverUrl + endpoint, { headers })
    return NextResponse.json({
      balances: data.map((item: any) => ({
        symbol: item.currency,
        balance: item.balance,
        locked: item.locked || '0',
      })),
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.response?.data?.error?.message || err.message || '업비트 잔고 조회 실패' },
      { status: 500 }
    )
  }
} 