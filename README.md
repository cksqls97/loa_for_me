# Loa For Me (로스트아크 재료 계산기)

로스트아크의 초월/엘릭서 등 재료 제작 및 비용을 계산하고 저장하는 웹 애플리케이션입니다.
GitHub Pages를 통해 정적 웹사이트로 배포되어 있으며, 별도의 서버 없이 브라우저 저장소(LocalStorage)를 사용하여 데이터를 유지합니다.

🔗 **바로가기**: [https://cksqls97.github.io/loa_for_me](https://cksqls97.github.io/loa_for_me)

## 주요 기능

- **재료 계산**: 
  - 아비도스 융화 재료
  - 상급 아비도스 융화 재료
  - 목표 수량에 따른 필요 재료(희귀/고급/일반) 자동 계산
- **데이터 저장**: 입력한 목표 수량 및 보유 재료는 브라우저를 닫아도 유지됩니다 (LocalStorage).
- **Overlay (PiP)**: 게임 플레이 중에도 확인 가능한 항상 위에 고정되는 미니 윈도우(Picture-in-Picture) 지원.
- **다크 모드 디자인**: 로스트아크 UI와 어울리는 깔끔한 다크 테마.

## 기술 스택

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
- **Deployment**: GitHub Pages (Static Export)

## 설치 및 실행 방법 (로컬 개발 시)

서버 없이 클라이언트 코드만으로 동작합니다.

### 1. 저장소 클론
```bash
git clone https://github.com/cksqls97/loa_for_me.git
cd loa_for_me/client
```

### 2. 패키지 설치 및 실행
```bash
npm install
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

## 배포 (GitHub Pages)

`main` 브랜치에 푸시하면 GitHub Actions가 자동으로 빌드하여 배포합니다.
