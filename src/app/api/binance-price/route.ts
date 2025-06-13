import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { symbols, includeUsdtKrw } = await req.json()

    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Invalid symbols parameter' }, { status: 400 })
    }

    // USDT/KRW 환율 조회
    let usdtKrw: number | null = null
    if (includeUsdtKrw) {
      try {
        const upbitResponse = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT')
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

    // 바이낸스 전체 시세 조회 후 필터링
    const binanceResponse = await fetch('https://api.binance.com/api/v3/ticker/price')
    if (!binanceResponse.ok) {
      throw new Error('바이낸스 API 호출 실패')
    }

    const allData = await binanceResponse.json()

    const prices: { [key: string]: string } = {}

    for (const symbol of symbols) {
      const item = allData.find((e: any) => e.symbol === `${symbol}USDT`)
      if (!item) continue

      const price = parseFloat(item.price)
      prices[symbol] = usdtKrw
        ? Math.round(price * usdtKrw).toLocaleString() + ' KRW'
        : '$' + price.toLocaleString()
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
