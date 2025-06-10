import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  const { symbols } = await req.json()
  if (!symbols || !Array.isArray(symbols)) {
    return NextResponse.json({ error: 'Missing symbols' }, { status: 400 })
  }
  try {
    const priceMap: { [symbol: string]: string } = {}
    for (const symbol of symbols) {
      if (symbol === 'USDT') continue;
      try {
        const res = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`)
        if (res.data && res.data.price) {
          priceMap[symbol] = res.data.price
        }
      } catch {}
    }
    return NextResponse.json({ prices: priceMap })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '바이낸스 시세 조회 실패' },
      { status: 500 }
    )
  }
} 