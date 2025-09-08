# 멀티모달 RAG 백엔드 API

비디오 분석과 멀티모달 검색을 지원하는 FastAPI 기반 백엔드 서버입니다.

## 주요 기능

- **멀티모달 RAG 검색** - 텍스트, 이미지, 비디오 프레임 검색
- **사용자별 대화 저장 및 검색** - 임계값 기반 유사도 필터링
- **OpenAI GPT-4o-mini 연동** - 비디오 프레임 분석
- **이미지 파일 자동 관리** - 업로드, 저장, 삭제 자동화
- **실시간 채팅방 관리** - 비디오 타임스탬프 기반 채팅방 생성

## 빠른 시작

### 1. 가상환경 설정 및 의존성 설치
```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# 의존성 설치
pip install -r requirements.txt
```

### 2. MongoDB 실행
```bash
# Docker를 사용한 MongoDB 실행
docker run -d --name mongodb_local -p 27017:27017 mongo:latest

# 또는 로컬 MongoDB 실행
mongod --dbpath ./data/db/mongodb
```

### 3. 서버 실행
```bash
# 백엔드 디렉토리에서
python -m src.api.main

# 또는 개발 모드로
python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

## 데이터베이스 스키마

### Users Collection
```javascript
{
  "user_id": "unique_user_id",           // 사용자 고유 ID
  "name": "홍길동",
  "email": "user@example.com",
  "login_type": "google|local",
  "openai_api_key": "encrypted_key",     // base64 암호화된 API 키
  "api_key_validated": true,
  "created_at": "2024-01-01T00:00:00Z",
  "last_login": "2024-01-01T00:00:00Z"
}
```

### User_Conversations Collection
```javascript
{
  "user_id": "unique_user_id",           // 사용자별 데이터 격리
  "conversation_id": "conv_12345678",
  "question": "질문 내용",
  "answer": "응답 내용", 
  "question_image": "base64_image",       // 선택사항
  "image_path": "/uploads/frame_*.jpg",   // 공유 이미지 파일 경로
  "timestamp": 125.5,                     // 비디오 타임스탬프
  "video_id": "temp_video_id",
  "combined_embedding": [...],            // 검색용 임베딩 벡터
  "shared_frame": true,                   // 공유 프레임 여부
  "created_at": "2024-01-01T00:00:00Z"
}
```

### User_Chat_Rooms Collection
```javascript
{
  "user_id": "unique_user_id",           // 사용자별 데이터 격리
  "room_id": "room_abc123",
  "name": "채팅방 이름 (예: 02:35)",
  "messages": [...],                      // 메시지 배열
  "video_context": {                     // 비디오 관련 정보
    "video_id": "temp_video_id",
    "captured_frame": "base64_image",
    "frame_time": "2024-01-01T00:00:00Z",
    "video_current_time": 155.5
  },
  "captured_frame": "base64_image",       // 썸네일 이미지
  "video_current_time": 155.5,            // 비디오 시간 (초)
  "is_archived": false,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### Multimodal_Documents Collection (RAG)
```javascript
{
  "content_type": "text|frame|multimodal",
  "text_content": "문서 내용",
  "image_path": "/uploads/image.jpg",
  "text_embedding": [...],               // 텍스트 임베딩 벡터
  "image_embedding": [...],              // 이미지 임베딩 벡터
  "multimodal_embedding": [...],         // 멀티모달 임베딩 벡터
  "metadata": {...},                     // 추가 메타데이터
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 주요 API 엔드포인트

### 사용자 관리
- `POST /users/register` - 사용자 등록
- `POST /users/login` - 로그인 (자동 등록)
- `GET /users/profile` - 프로필 조회

### OpenAI API 키 관리
- `POST /users/openai-key/test` - API 키 유효성 검사
- `POST /users/openai-key/save` - API 키 저장
- `GET /users/openai-key/status` - API 키 상태 확인
- `DELETE /users/openai-key` - API 키 삭제

### 대화 관리
- `POST /conversations/save` - 대화 저장
- `POST /conversations/search` - 대화 검색
- `GET /conversations/history` - 대화 이력 조회

### 채팅방 관리
- `POST /chatrooms/save` - 채팅방 저장
- `GET /chatrooms` - 채팅방 목록 조회
- `GET /chatrooms/{video_id}` - 특정 비디오의 채팅방 목록
- `GET /chatrooms/{room_id}/details` - 채팅방 상세 조회
- `DELETE /chatrooms/{room_id}` - 채팅방 및 관련 대화, 이미지 삭제

### RAG 검색
- `POST /search/text` - 텍스트 검색 (임계값: 0.4)
- `POST /search/image` - 이미지 검색
- `POST /search/multimodal` - 멀티모달 검색
- `POST /search/hybrid` - 하이브리드 검색

### 데이터 업로드
- `POST /ingest/text` - 텍스트 문서 업로드
- `POST /ingest/image` - 이미지 업로드
- `POST /ingest/multimodal` - 멀티모달 데이터 업로드
- `POST /frames/save` - 비디오 프레임 저장

### OpenAI 채팅
- `POST /openai/chat` - GPT-4o-mini와 대화 (이미지 분석 지원)

## 인증

모든 API 요청에는 `X-User-ID` 헤더가 필요합니다.

```bash
curl -H "X-User-ID: your_user_id" \
     -X GET "http://localhost:8000/users/profile"
```

## 설정

### 환경 변수
```bash
# MongoDB 설정
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=multimodal_rag

# 파일 저장 경로
UPLOADS_DIR=./data/uploads
LOG_LEVEL=INFO
```

### 디렉토리 구조
```
back/
├── data/
│   ├── db/mongodb/     # MongoDB 데이터
│   ├── uploads/        # 업로드된 이미지 파일
│   ├── logs/           # 로그 파일
│   └── models/         # ML 모델 캐시
├── src/
│   ├── api/            # FastAPI 엔드포인트
│   ├── database/       # 데이터베이스 관련
│   ├── models/         # 임베딩 모델
│   └── utils/          # 유틸리티 함수
└── requirements.txt
```

## API 문서

서버 실행 후 다음 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 개발 가이드

### 로깅
모든 API 호출과 에러는 `data/logs/` 폴더에 자동 저장됩니다.

### 데이터베이스 관리
```bash
# 데이터베이스 상태 확인
python check_db_data.py
```