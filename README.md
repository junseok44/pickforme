# 🛒 픽포미 Pick for Me

> 시각장애인을 위한 AI 기반 상품 정보 접근성 서비스

## 📋 프로젝트 개요

픽포미는 시각장애인을 위한 접근성 중심의 상품 정보 서비스입니다. 쿠팡 링크를 입력하거나 추천 상품을 선택하면, AI가 상품의 썸네일, 상세 이미지, 리뷰 등을 분석하여 대체 텍스트로 제공합니다. 또한 AI 챗봇을 통해 상품에 대한 질문을 자연어로 할 수 있으며, 매니저에게 직접 문의할 수 있는 기능도 제공합니다.

## 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트 레이어                         │
├─────────────────┬───────────────────────────────────────────────┤
│   Mobile App    │           Admin Panel (Web)                  │
│ (React Native)  │           (Next.js)                          │
│                 │                                               │
│  - iOS/Android  │  - Analytics Dashboard                       │
│  - 접근성 UI     │  - 성공률 모니터링                           │
│  - 음성 안내     │  - 로그 관리                                 │
│  - 상품 분석        - 사용자 분석                               │
└─────────────────┴───────────────────────────────────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        배포 환경                                │
├─────────────────────────────────────────────────────────────────┤
│  Vercel (Admin)          │  AWS EC2 (Backend)                  │
│  ┌─────────────────┐     │  ┌─────────────┐  ┌─────────────┐    │
│  │   Next.js App   │     │  │    Nginx    │  │ Node.js API │    │
│  │                 │     │  │  (Reverse   │  │  (Koa.js)   │    │
│  │  - 동적 호스팅   │     │  │   Proxy)    │  │             │    │
│  │  - CDN 배포     │     │  │  - SSL      │  │  - 비즈니스 로직│  │
│  │  - 자동 배포     │     │  │  - 포트포워딩│  │  - API 처리  │    │
│  │  - SSR/SSG      │     │  │  - 로드밸런싱│  │  - 데이터 관리│    │
│  └─────────────────┘     │  │  - 캐싱     │  │  - 외부 연동 │    │
│                          │  └─────────────┘  └─────────────┘    │
│                          │                       │              │
│                          │                       ▼              │
│                          │              ┌─────────────┐         │
│                          │              │  AI 서비스   │         │
│                          │              │  (외부 연동) │         │
│                          │              │             │         │
│                          │              │  - Gemini   │         │
│                          │              │  - OpenAI   │         │
│                          │              │  - 이미지 분석│        │
│                          │              │  - 텍스트 변환│        │
│                          │              └─────────────┘         │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┬─────────────────┬─────────────────────────────┐
│   MongoDB Atlas │  Google BigQuery│      GitHub Actions         │
│   (Primary DB)  │  (Analytics DB) │      (CI/CD)                │
│                 │                 │                             │
│  - 상품 정보     │  - 사용자 분석  │  - 자동 배포                │
│  - 사용자 데이터 │  - 성공률 통계  │  - 테스트 실행              │
│  - 접근성 로그   │  - Firebase 연동│  - Docker 빌드              │
│  - 세션 관리     │  - 대시보드 데이터│  - AWS 배포                │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

### 🌐 배포 환경

- **모바일 앱**: 크로스 플랫폼 (iOS/Android) - React Native + Expo
- **관리자 대시보드**: Vercel에서 호스팅 (Next.js 동적 호스팅, SSR/SSG)
- **백엔드 API**: AWS EC2 + Nginx (리버스 프록시, 포트포워딩)
- **데이터베이스**:
  - MongoDB Atlas (Primary DB - 상품 정보, 사용자 데이터)
  - Google BigQuery (Analytics DB - 사용자 분석, 성공률 통계)
- **AI 서비스**: 외부 연동 (Gemini, OpenAI) - 이미지 분석, 텍스트 변환
- **CI/CD**: GitHub Actions (자동 배포, 테스트, Docker 빌드)
- **CDN**: Vercel CDN (관리자 대시보드)
- **SSL**: Nginx를 통한 HTTPS 지원

## 🛠️ 기술 스택

### Backend (`/back`)

- **Runtime**: Node.js
- **Framework**: Koa.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **Real-time**: Socket.io
- **AI/ML**: OpenAI GPT, Google Gemini (이미지 분석 및 텍스트 변환)
- **Web Scraping**: Playwright, Puppeteer (쿠팡 상품 정보 수집)
- **Analytics**: Google BigQuery, Firebase Analytics
- **Testing**: Jest
- **Process Management**: PM2

### Frontend (`/front`)

- **Framework**: React Native
- **Navigation**: Expo Router
- **State Management**: Jotai
- **UI Library**: React Native Paper
- **Accessibility**: VoiceOver, TalkBack 지원
- **Authentication**: Google Sign-In, Apple Sign-In, Kakao Login
- **Payment**: React Native IAP (멤버십)
- **Real-time**: Socket.io Client (챗봇, 매니저 문의)
- **Testing**: Jest, React Native Testing Library
- **Build**: EAS (Expo Application Services)

### Admin (`/admin`)

- **Framework**: Next.js 13
- **UI Library**: Ant Design
- **State Management**: Jotai
- **Charts**: Recharts
- **Authentication**: Google OAuth
- **Analytics**: Firebase Analytics, Google BigQuery
- **Real-time**: Socket.io Client

## 📁 프로젝트 구조

```
pickforme-backups/
├── back/                    # 백엔드 API 서버
│   ├── src/
│   │   ├── feature/         # 기능별 모듈
│   │   │   ├── analytics/   # 분석 및 통계
│   │   │   ├── coupang/     # 쿠팡 파트너스 연동
│   │   │   └── subscription/ # 구독 관리
│   │   ├── models/          # 데이터베이스 모델
│   │   ├── router/          # API 라우터
│   │   ├── services/        # 비즈니스 로직
│   │   ├── middleware/      # 미들웨어
│   │   ├── scheduler/       # 스케줄러
│   │   └── utils/           # 유틸리티
│   └── package.json
├── front/                   # 모바일 앱
│   ├── app/                 # Expo Router 페이지
│   │   ├── (tabs)/         # 탭 네비게이션
│   │   ├── (onboarding)/   # 온보딩 플로우
│   │   └── (settings)/     # 설정 페이지
│   ├── components/          # 재사용 가능한 컴포넌트
│   ├── hooks/              # 커스텀 훅
│   ├── stores/             # 상태 관리
│   ├── services/           # API 서비스
│   └── package.json
├── admin/                   # 관리자 대시보드
│   ├── src/
│   │   ├── pages/          # Next.js 페이지
│   │   │   ├── analytics/  # 분석 페이지
│   │   │   └── log/        # 로그 관리
│   │   ├── components/     # React 컴포넌트
│   │   ├── stores/         # 상태 관리
│   │   └── hooks/          # 커스텀 훅
│   └── package.json
└── docker-compose.dev.yml   # 개발 환경 설정
```

## 🚀 개발 환경 설정

### 사전 요구사항

- Node.js 18+
- Docker & Docker Compose
- MongoDB
- iOS 개발: Xcode
- Android 개발: Android Studio

### 설치 및 실행

1. **저장소 클론**

```bash
git clone <repository-url>
cd pickforme-backups
```

2. **Docker로 개발 환경 실행**

```bash
# 모든 서비스 실행 (MongoDB, Backend, Admin)
docker-compose -f docker-compose.dev.yml up -d

# 또는 개별 서비스 실행
docker-compose -f docker-compose.dev.yml up db server admin
```

3. **개별 서비스 개발**

**Backend 개발**

```bash
cd back
npm install
npm run dev
```

**Frontend 개발**

```bash
cd front
yarn install
yarn start
```

**Admin 개발**

```bash
cd admin
npm install
npm run dev
```

### 환경 변수 설정

각 서비스별로 `.env.local` 파일을 생성하고 필요한 환경 변수를 설정하세요.

## 📱 주요 기능

### 모바일 앱

- **상품 정보 접근성**: 쿠팡 링크 입력 또는 추천 상품 선택 시 AI가 이미지를 분석하여 대체 텍스트 제공
- **AI 챗봇**: 상품에 대한 질문을 자연어로 할 수 있는 AI 챗봇 서비스
- **매니저 문의**: 실시간으로 매니저에게 상품 관련 질문 가능
- **상품 검색**: 쿠팡 상품 검색 및 필터링
- **위시리스트**: 관심 상품 저장 및 관리
- **멤버십**: 프리미엄 기능을 위한 구독 서비스
- **구매 연결**: 쿠팡으로 이어지는 구매 버튼
- **접근성 지원**: VoiceOver, TalkBack 등 스크린 리더 완벽 지원

### 관리자 대시보드

- **성공률 모니터링**: 상품 정보 제공 성공률 추적 및 분석
- **사용자 분석**: Firebase Analytics, BigQuery를 활용한 사용자 행동 패턴 분석
- **시스템 로그**: 상품 정보 제공 관련 시스템 로그 수집 및 관리
- **에러 추적**: 접근성 서비스 관련 에러 모니터링
- **알림 관리**: 공지사항 및 푸시 알림 관리

### 백엔드 API

- **RESTful API**: 모바일 앱 및 관리자 대시보드용 API
- **WebSocket**: 실시간 챗봇 및 매니저 문의
- **AI 서비스**: 이미지 분석, 텍스트 변환, 챗봇 응답
- **크롤링**: 쿠팡 상품 정보 수집 및 파싱
- **접근성 로깅**: 상품 정보 제공 성공/실패 로그 수집

## 🧪 테스트

```bash
# Backend 테스트
cd back
npm run test
npm run test:coverage

# Frontend 테스트
cd front
yarn test

# Admin 테스트
cd admin
npm run test
```

## 📦 배포

### 모바일 앱

```bash
cd front
# 스테이징 배포
yarn update:staging

# 프로덕션 배포
yarn update:production
```

### 백엔드

```bash
cd back
npm run build
npm run pm2
```

### 관리자 대시보드

```bash
cd admin
npm run build
npm run start
```
