import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://api.upbit.com/v1/market/all?isDetails=false', {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '업비트 API 호출 실패')
    }

    const data = await response.json()
    return NextResponse.json({ markets: data.map((item: any) => item.market) })
  } catch (error: any) {
    console.error('업비트 마켓 목록 조회 에러:', error)
    return NextResponse.json(
      { error: error.message || '업비트 마켓 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 