# 🚀 DigiVault — 디지털 자산 보관 및 차익 거래 플랫폼 (모의)

> 커스터디 서비스와 차익 거래 시세 분석 기능을 통합한 Web3 기반 디지털 자산 플랫폼  
> 업비트 API 연동 및 멀티 거래소 시세 비교를 통해 사용자 자산 흐름을 투명하게 관리하고,  
> GCP 기반의 CI/CD 파이프라인을 통해 운영 안정성을 확보한 프로젝트입니다.

---

## 🛠️ 기술 스택

| 영역 | 스택 |
|------|------|
| **프론트엔드** | `Next.js 15`, `TypeScript 5`, `Tailwind CSS`, `Zustand` |
| **백엔드/API** | `Next.js Route Handlers`, `Supabase`, `PostgreSQL` |
| **지갑 연동** | `wagmi`, `ethers.js`, `viem` |
| **CI/CD** | `GitHub Actions`, `Docker`, `GCP GKE`, `Helm` |
| **테스트** | `Playwright` (E2E) |
| **디자인 협업** | `Figma` (디자인 시스템 기반 UI 개선) |

---

## 📦 주요 기능

| 기능명 | 설명 |
|--------|------|
| 🧑‍💼 메타마스크 로그인 | `wagmi` 기반의 Web3 로그인 |
| 🏦 업비트 자산 연동 | Access/Secret Key 입력 시 실제 잔고 조회 가능 |
| 📈 시세 비교 | 업비트/바이낸스/코인베이스/OKX 가격 비교 후 차익 계산 |
| 💰 차익 실현 포인트 강조 | 거래소별 가격 차이 및 수익 예측 정보 제공 |
| 💼 자산 대시보드 | 보유 자산, 시세, 차익을 테이블 기반으로 통합 시각화 |
| 🚀 CI/CD 자동 배포 | `GitHub Actions` + `GCP Artifact Registry` + `Helm` 기반 자동화 |
| 🔐 보안 고려 | `.env.production` 자동 주입, 키 로컬 보관, CORS 프록시 처리 |

---

## 🧱 시스템 구조

Next.js App (13+/App Router)
├── /app
│ └── /wallet (Client Page)
├── /api
│ ├── upbit-balance.ts
│ ├── binance-price.ts
│ ├── ...
├── Zustand Store
│ └── useWalletStore.ts
├── Components
│ └── ConnectWallet.tsx, WalletPage.tsx 등

yaml
복사
편집

---

## 🔐 보안 설계 고려

- ✅ Supabase env 자동 주입 (`NEXT_PUBLIC_...` secret → `.env.production`)
- ✅ 외부 API (Upbit, Binance 등) 프록시 처리 → CORS 우회
- ✅ 업비트 Secret Key는 상태만 저장하고, Supabase에 직접 저장하지 않음
- ✅ GCP IAM 권한 최소화된 SA만 GitHub Actions에서 사용
- ✅ CI/CD시 이미지 태그를 `date +%Y%m%d%H%M%S`로 버전 관리

---

## 🚀 CI/CD 배포 구조

| 단계 | 설명 |
|------|------|
| **빌드** | GitHub Actions에서 Docker Image 빌드 후 GCP Artifact Registry에 푸시 |
| **배포** | Helm Chart를 통해 GKE에 자동 배포 (버전 태그 기반) |
| **DNS** | 가비아 도메인 → LoadBalancer IP 연결 (A 레코드) |
| **확인** | `https://yourdomain.com`으로 접근해 자산 확인 가능 |

---

## 🧪 향후 발전 방향

- [ ] **JWT 기반 세션 관리 및 SSO 연동**
- [ ] **다중 지갑(Naver, Kaikas 등) 연동**
