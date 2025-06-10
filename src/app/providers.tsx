'use client';

import { WagmiConfig, createConfig } from 'wagmi';
import { http } from 'viem';
import { mainnet } from 'wagmi/chains';
import { InjectedConnector } from 'wagmi/connectors/injected'; // ✅ 수정
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createPublicClient, fallback } from 'viem';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: fallback([
    http('https://mainnet.infura.io/v3/YOUR_INFURA_KEY'), // 🔑 본인 키로 교체
  ]),
});

const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      options: {
        shimDisconnect: true, // ✅ 선택: MetaMask 연결 유지
      },
    }),
  ],
  publicClient,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>{children}</WagmiConfig>
    </QueryClientProvider>
  );
}
