import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { symbols } = await req.json()
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Invalid symbols parameter' }, { status: 400 })
    }

    const marketQuery = symbols.map(s => `KRW-${s}`).join(',')
    const response = await fetch(`https://api.upbit.com/v1/ticker?markets=${marketQuery}`, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '업비트 API 호출 실패')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('업비트 시세 조회 에러:', error)
    return NextResponse.json(
      { error: error.message || '업비트 시세 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
} 