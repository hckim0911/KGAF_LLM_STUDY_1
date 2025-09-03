# Talk To Me: Private LLM Video-Chat RAG System

> 로컬 LLM과 RAG 기술을 활용해 비디오와 채팅 데이터를 지식으로 전환하고, 맥락 기반으로 검색·활용할 수 있는 시스템입니다.

---

## 📜 프로젝트 소개

영상 콘텐츠를 보며 중요한 생각이 떠올라도, 메모하거나 캡처하는 과정이 번거로워 흐름이 끊기는 경험이 있었습니다.  
**Talk To Me**는 이런 불편함을 해결하기 위해 기획되었습니다.  
“말하는 것만으로 기록과 정리가 자동으로 된다면 얼마나 편리할까?”라는 문제의식에서 출발한 프로젝트입니다.  

이 시스템은 사용자의 **사고 발화(spoken thoughts)**를 실시간으로 수집해 텍스트로 변환하고,  
AI가 자동으로 **요약·키워드 추출·주제 분류**를 수행합니다.  
단순 저장이 아니라 **지식 단위로 체계화**되므로, 시간이 지나도 **영상 장면·프레임·채팅 로그와 함께 맥락적으로 검색**할 수 있습니다.  

개발 과정에서 우리는 **멀티모달 임베딩(CLIP + 텍스트 모델)**, **벡터 DB(MongoDB)**, **LangChain 기반 RAG 파이프라인**을 실제로 다뤄보며  
“사용자 경험(UX) 설계에서 입력 장벽을 낮추는 것”의 중요성 또한 배웠습니다.  

---

## ✨ 주요 기능

- **🗣️ 발화 기반 지식 정리**  
  영상을 시청하면서 자연스럽게 말한 생각을 실시간으로 텍스트로 변환합니다.  
  → 복잡한 입력 과정을 대체하며, 누구나 쉽게 지식을 디지털화할 수 있습니다.  

- **🤖 LLM 자동 요약 및 분류**  
  수집된 발화를 LLM이 요약하고 키워드·주제별로 분류합니다.  
  → 단순한 기록이 아니라 체계적 지식으로 정리됩니다. (이 부분을 구현하며 *지식 구조화의 가치를 실감했습니다.*)  

- **🔍 맥락 기반 검색**  
  단순 키워드 검색이 아니라, 영상의 시간대, 프레임, 채팅 로그 등 **맥락 정보와 함께** 결과를 제공합니다.  
  → 축적된 지식 속에서 필요한 정보를 즉시 재발견할 수 있습니다.  

- **💡 새로운 통찰 제공**  
  유사한 발화나 장면을 연결해 **새로운 연관성**을 제안합니다.  
  → 멀티모달 데이터를 엮어 보며 *“검색을 넘은 통찰 제공”*이라는 프로젝트의 차별성을 확인했습니다.  

---

## 💡 사용 시나리오 (How it Works)

1. **지식 수집 (Capture)**  
   사용자가 다큐멘터리를 보며 말합니다:  
   > "이 통계는 내 프로젝트 보고서에 인용하면 좋겠다. 특히 시장 성장률 부분."

   시스템은 발화를 텍스트화하고 *‘프로젝트 보고서’*, *‘시장 성장률’* 키워드를 추출합니다.  
   동시에 해당 영상의 **시간대와 프레임**을 함께 저장합니다.

2. **검색 및 활용 (Retrieve & Use)**  
   며칠 뒤 보고서를 작성하며 검색합니다:  
   > "프로젝트 시장 성장률"

   시스템은 저장된 발화와 함께, 당시 영상의 **정확한 장면과 관련 정보**를 즉시 찾아줍니다.

---

## 🎯 대상 사용자 (Target Users)

- **기록이 번거로운 사용자**  
  비디오·문서·강의를 보면서 생각을 기록하기 힘든 사용자에게, 발화 기반 인터페이스는 진입장벽을 낮춘 대안이 됩니다.  

- **지식 활용이 어려운 사용자**  
  시간이 지나 지식이 쌓이면 필요한 정보를 찾기 어려워지는데,  
  맥락 기반 검색 기능은 이를 즉시 재발견할 수 있게 합니다.  

---

## 🏗️ 시스템 아키텍처

본 프로젝트는 **모듈화 구조**로 설계되었습니다.

- **프론트엔드 (UI)**  
  사용자가 영상을 재생하고 채팅을 입력하는 인터페이스  
  - GitHub: `video_chat_test(https://github.com/JaeHyeon-KAIST/video_chat_test/)`, `google_login_test(https://github.com/JaeHyeon-KAIST/google_login_test)`  

- **백엔드 (API)**  
  데이터 저장, RAG 파이프라인, 검색 로직을 처리하는 API 서버  
  - GitHub: `multimodal-mongodb-retrieval-system(https://github.com/a2ran/multimodal-mongodb-retrieval-system)`  

- **AI 모델**  
  멀티모달 데이터(이미지 프레임·텍스트) 임베딩, LangChain 기반 RAG 파이프라인  

---

## 💻 기술 스택 (Tech Stack)

- **Frontend**: React.js, JavaScript, CSS  
- **Backend**: Python, FastAPI  
- **Database**: MongoDB (Vector DB), 필요 시 RDBMS 병행  
- **AI / LLM**  
  - Local LLM Framework: Ollama, LM Studio  
  - Multimodal Model: CLIP, Sentence-Transformers  
  - LLM Application Framework: LangChain  
- **API**: OpenAI API 

---

## 🚀 설치 및 실행

### Backend


### Frontend


---

## 👥 팀 구성원
- **이재현**: PL, Frontend, System Management  
- **조의현**: Backend, AI Model  
- **송민근**: Documentation
- **Geena Kim**  System Argorithm Design
- **Hyeongcheol Kim**: Something else
