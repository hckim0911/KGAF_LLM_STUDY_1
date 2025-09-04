# AI 비디오 분석 채팅 앱

영상의 특정 프레임을 캡처하여 GPT-4o-mini와 실시간으로 대화할 수 있는 React 기반 웹 애플리케이션입니다.

## 🎯 주요 기능

### 📹 비디오 프레임 분석

- **영상 업로드**: 다양한 비디오 포맷 지원
- **프레임 캡처**: 일시정지 시 자동으로 현재 화면 캡처
- **실시간 분석**: 캡처된 이미지를 GPT-4o-mini에 전송하여 분석

### 💬 다중 채팅방 시스템

- **시간 기반 채팅방**: 영상 시간(예: 02:46)으로 채팅방 자동 생성
- **스마트 채팅방 관리**: 같은 시간대 재방문 시 기존 채팅방으로 이동
- **프레임 미리보기**: 각 채팅방에서 분석 중인 프레임 상시 표시

### 🤖 AI 대화 기능

- **GPT-4o-mini 연동**: 최신 OpenAI 모델 사용
- **비전 분석**: 이미지와 텍스트를 함께 분석
- **컨텍스트 유지**: 각 프레임별 독립적인 대화 히스토리

## 🚀 설치 및 실행

### 설치 방법

1**의존성 설치**

```bash
npm install
# 또는
yarn install
```

2**개발 서버 실행**

```bash
npm start
# 또는
yarn start
```

3**브라우저에서 접속**

```
http://localhost:3000
```

## 🔧 사용 방법

### 1단계: API 키 설정

- 앱 실행 후 "OpenAI API 키 설정하기" 클릭
- OpenAI API 키 입력 ([OpenAI Platform](https://platform.openai.com/api-keys)에서 발급)

### 2단계: 영상 업로드

- "영상 업로드" 버튼 클릭하여 비디오 파일 선택
- 지원 포맷: MP4, AVI, MOV, WebM 등

### 3단계: 프레임 분석

- 궁금한 장면에서 영상 일시정지
- 해당 시간대의 채팅방 자동 생성
- 캡처된 프레임에 대해 AI와 대화

### 4단계: 채팅방 관리

- 채팅방 목록 버튼으로 이전 분석한 프레임들 확인
- 각 채팅방은 영상 시간으로 구분
- 불필요한 채팅방 삭제 가능

## 🏗️ 프로젝트 구조

```
src/
├── App.js                    # 메인 애플리케이션
├── App.css                   # 메인 스타일
├── components/               # React 컴포넌트
│   ├── VideoPlayer.js        # 비디오 플레이어
│   ├── VideoPlayer.css
│   ├── ChatSection.js        # 채팅 인터페이스
│   ├── ChatSection.css
│   ├── MessageList.js        # 메시지 목록
│   ├── MessageList.css
│   ├── LoadingIndicator.js   # 로딩 애니메이션
│   ├── LoadingIndicator.css
│   ├── ApiKeyModal.js        # API 키 설정 모달
│   ├── ApiKeyModal.css
│   ├── ChatRoomList.js       # 채팅방 목록
│   └── ChatRoomList.css
└── utils/                    # 유틸리티 함수
    ├── chatRoomManager.js    # 채팅방 관리
    ├── videoHandlers.js      # 비디오 이벤트 처리
    ├── messageHandlers.js    # 메시지 처리
    ├── chatRoomHandlers.js   # 채팅방 이벤트 처리
    └── openai.js            # OpenAI API 연동
```

## 🔑 API 키 관리

### 주의사항

- API 키는 브라우저 세션에만 임시 저장
- 새로고침 시 재입력 필요
