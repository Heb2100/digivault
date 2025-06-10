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
        // Coinbase API는 USD 기준으로 가격을 제공
        const res = await axios.get(`https://api.coinbase.com/v2/prices/${symbol}-USD/spot`)
        if (res.data && res.data.data?.amount) {
          // USD 가격을 KRW로 변환 (업비트 USDT/KRW 환율 사용)
          const usdPrice = parseFloat(res.data.data.amount)
          const usdtKrwRes = await axios.get('https://api.upbit.com/v1/ticker?markets=KRW-USDT')
          const usdtKrw = usdtKrwRes.data?.[0]?.trade_price
          if (usdtKrw) {
            const krwPrice = Math.round(usdPrice * usdtKrw)
            priceMap[symbol] = krwPrice.toLocaleString() + ' KRW'
          } else {
            priceMap[symbol] = '$' + usdPrice.toLocaleString()
          }
        }
      } catch {}
    }
    return NextResponse.json({ prices: priceMap })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Coinbase 시세 조회 실패' },
      { status: 500 }
    )
  }
} 