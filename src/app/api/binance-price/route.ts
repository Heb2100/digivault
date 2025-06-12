import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  try {
    const { symbols, includeUsdtKrw } = await req.json()
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Invalid symbols parameter' }, { status: 400 })
    }

    // USDT/KRW 환율 조회
    let usdtKrw = null
    if (includeUsdtKrw) {
      try {
        const upbitResponse = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT', {
          headers: {
            'Accept': 'application/json',
          },
        })
        if (upbitResponse.ok) {
          const upbitData = await upbitResponse.json()
          if (upbitData && upbitData[0]?.trade_price) {
            usdtKrw = upbitData[0].trade_price
          }
        }
      } catch (error) {
        console.error('USDT/KRW 환율 조회 에러:', error)
      }
    }

    // 바이낸스 시세 조회
    const binanceResponse = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${JSON.stringify(symbols.map(s => `${s}USDT`))}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!binanceResponse.ok) {
      const error = await binanceResponse.json()
      throw new Error(error.message || '바이낸스 API 호출 실패')
    }

    const binanceData = await binanceResponse.json()
    const prices: { [key: string]: string } = {}

    // 가격 데이터 가공
    for (const item of binanceData) {
      const symbol = item.symbol.replace('USDT', '')
      const price = parseFloat(item.price)
      
      if (usdtKrw) {
        prices[symbol] = Math.round(price * usdtKrw).toLocaleString() + ' KRW'
      } else {
        prices[symbol] = '$' + price.toLocaleString()
      }
    }

    return NextResponse.json({
      prices,
      usdtKrw
    })
  } catch (error: any) {
    console.error('바이낸스 시세 조회 에러:', error)
    return NextResponse.json(
      { error: error.message || '바이낸스 시세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 