# Loa For Me (로스트아크 재료 계산기)

로스트아크의 초월/엘릭서 등 재료 제작 및 비용을 계산하고 저장하는 웹 애플리케이션입니다.

## 주요 기능

- **재료 계산**: 아비도스 / 상급 아비도스 융화 재료 제작에 필요한 재료 자동 계산
- **데이터 저장**: 사용자별 보유 재료 및 목표 슬롯 상태 저장 (MongoDB + LocalStorage)
- **Overlay (PiP)**: 게임 플레이 중에도 확인 가능한 항상 위에 고정되는 미니 윈도우 지원
- **탭 지원**: 아비도스 / 상급 아비도스 전환 기능

## 기술 스택

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB
- **Database**: MongoDB

## 설치 및 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/cksqls97/loa_for_me.git
cd loa_for_me
```

### 2. Backend 설정 (Server)
```bash
cd server
npm install
# .env 파일 생성 후 MONGO_URI 설정 필요
npm run dev
```

### 3. Frontend 설정 (Client)
```bash
cd client
npm install
npm run dev
```

### 4. 접속
브라우저에서 `http://localhost:3000` 접속
