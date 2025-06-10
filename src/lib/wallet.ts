export async function fetchWalletBalances(address: string): Promise<{
    eth: string
    tokens: { symbol: string; balance: string }[]
  }> {
    // 예: ethers.js 또는 viem 사용
    return {
      eth: '0.23',
      tokens: [
        { symbol: 'DAI', balance: '12.3' },
        { symbol: 'USDC', balance: '50.0' },
      ],
    }
  }