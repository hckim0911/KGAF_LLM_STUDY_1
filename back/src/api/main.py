import sys
import os
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
import shutil
import logging
import json
from datetime import datetime

from src.database.schemas import SearchQuery, ContentType, VideoInfo, FrameData, ChatData, ConversationSearchRequest, ChatRoomData, ConversationSearchResult, User, UserRegistrationRequest, UserLoginRequest, OpenAIKeyRequest, OpenAIKeyTestRequest
from src.utils.data_ingestion import DataIngestion
from src.utils.retrieval import MultimodalRetriever
from src.utils.conversation_manager import ConversationManager
from src.config import settings

# Configure logging to use back/data/logs directory
import logging.config
from datetime import datetime

# Ensure log directory exists
settings.ensure_directories()

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(settings.LOG_FILE, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Multimodal MongoDB RAG API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def extract_user_id(request: Request, call_next):
    user_id = request.headers.get("X-User-ID")
    request.state.user_id = user_id
    response = await call_next(request)
    return response

ingestion_service = DataIngestion()
retrieval_service = MultimodalRetriever()
conversation_manager = ConversationManager()

from src.database.mongodb_client import MongoDBClient
db_client = MongoDBClient()
db_client.connect()
users_collection = db_client.get_collection("users")
user_conversations_collection = db_client.get_collection("user_conversations")
user_chat_rooms_collection = db_client.get_collection("user_chat_rooms")

UPLOAD_DIR = settings.UPLOADS_DIR
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Static files serving for uploaded images
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


class TextSearchRequest(BaseModel):
    query: str
    top_k: int = 10
    content_type: Optional[str] = None

class HybridSearchRequest(BaseModel):
    text: Optional[str] = None
    image_base64: Optional[str] = None
    text_weight: float = 0.5
    top_k: int = 10

class ChatRoomSaveRequest(BaseModel):
    room_id: str
    name: str
    messages: List[Dict[str, Any]]
    captured_frame: Optional[str] = None
    frame_time: Optional[str] = None
    video_current_time: Optional[float] = None
    video_id: Optional[str] = None


def get_user_id_from_request(request: Request) -> str:
    user_id = request.state.user_id
    if not user_id:
        raise HTTPException(status_code=401, detail="X-User-ID header is required")
    return user_id


@app.get("/")
async def root():
    return {"message": "Multimodal MongoDB RAG API", "status": "active"}


# User Management Endpoints
@app.post("/users/register")
async def register_user(request: UserRegistrationRequest):
    try:
        # Check if user already exists
        existing_user = users_collection.find_one({"user_id": request.user_id})
        if existing_user:
            return {"message": "User already exists", "user_id": request.user_id, "status": "exists"}
        
        # Create new user
        user_data = {
            "user_id": request.user_id,
            "name": request.name,
            "email": request.email,
            "login_type": request.login_type,
            "profile_image": request.profile_image,
            "is_active": True,
            "preferences": {},
            "created_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = users_collection.insert_one(user_data)
        return {
            "message": "User registered successfully",
            "user_id": request.user_id,
            "document_id": str(result.inserted_id),
            "status": "created"
        }
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/login")
async def login_user(request: UserLoginRequest):
    try:
        # Find or create user
        user = users_collection.find_one({"user_id": request.user_id})
        
        if not user:
            # Auto-register user on first login
            user_data = {
                "user_id": request.user_id,
                "name": request.name or f"User_{request.user_id[:8]}",
                "email": request.email or "",
                "login_type": "auto",
                "profile_image": None,
                "is_active": True,
                "preferences": {},
                "created_at": datetime.utcnow(),
                "last_login": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = users_collection.insert_one(user_data)
            user = users_collection.find_one({"_id": result.inserted_id})
        else:
            # Update last login
            users_collection.update_one(
                {"user_id": request.user_id},
                {"$set": {"last_login": datetime.utcnow(), "updated_at": datetime.utcnow()}}
            )
        
        return {
            "message": "Login successful",
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "login_type": user["login_type"],
                "profile_image": user.get("profile_image"),
                "last_login": user["last_login"].isoformat()
            },
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/profile")
async def get_user_profile(request: Request):
    try:
        user_id = get_user_id_from_request(request)
        user = users_collection.find_one({"user_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user": {
                "user_id": user["user_id"],
                "name": user["name"],
                "email": user["email"],
                "login_type": user["login_type"],
                "profile_image": user.get("profile_image"),
                "preferences": user.get("preferences", {}),
                "has_api_key": bool(user.get("openai_api_key")),
                "api_key_validated": user.get("api_key_validated", False),
                "created_at": user["created_at"].isoformat(),
                "last_login": user["last_login"].isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# OpenAI API Key Management
@app.post("/users/openai-key/test")
async def test_openai_key(request: Request, key_request: OpenAIKeyTestRequest):
    try:
        user_id = get_user_id_from_request(request)
        
        # Test the API key with OpenAI
        import openai
        
        try:
            client = openai.OpenAI(api_key=key_request.api_key)
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": key_request.test_message}],
                max_tokens=50
            )
            
            # If we get here, the API key works
            return {
                "valid": True,
                "message": "API key is valid",
                "test_response": response.choices[0].message.content[:100] + "..." if len(response.choices[0].message.content) > 100 else response.choices[0].message.content
            }
            
        except openai.AuthenticationError:
            return {
                "valid": False,
                "message": "Invalid API key",
                "error": "Authentication failed"
            }
        except openai.RateLimitError:
            return {
                "valid": True,
                "message": "API key is valid but rate limited",
                "warning": "Rate limit reached"
            }
        except Exception as api_error:
            return {
                "valid": False,
                "message": "API key test failed",
                "error": str(api_error)
            }
            
    except Exception as e:
        logger.error(f"Error testing OpenAI key: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/users/openai-key/save")
async def save_openai_key(request: Request, key_request: OpenAIKeyRequest):
    try:
        user_id = get_user_id_from_request(request)
        
        # Simple encryption (base64 encoding for basic obfuscation)
        import base64
        encrypted_key = base64.b64encode(key_request.api_key.encode()).decode()
        
        # Update user with encrypted API key
        result = users_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "openai_api_key": encrypted_key,
                    "api_key_validated": True,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            return {
                "message": "OpenAI API key saved successfully",
                "status": "success"
            }
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        logger.error(f"Error saving OpenAI key: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/users/openai-key/status")
async def get_openai_key_status(request: Request):
    try:
        user_id = get_user_id_from_request(request)
        user = users_collection.find_one({"user_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "has_api_key": bool(user.get("openai_api_key")),
            "api_key_validated": user.get("api_key_validated", False),
            "last_updated": user.get("updated_at", user.get("created_at")).isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting OpenAI key status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/users/openai-key")
async def delete_openai_key(request: Request):
    try:
        user_id = get_user_id_from_request(request)
        
        result = users_collection.update_one(
            {"user_id": user_id},
            {
                "$unset": {"openai_api_key": ""},
                "$set": {
                    "api_key_validated": False,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            return {
                "message": "OpenAI API key deleted successfully",
                "status": "success"
            }
        else:
            raise HTTPException(status_code=404, detail="User not found")
            
    except Exception as e:
        logger.error(f"Error deleting OpenAI key: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/text")
async def ingest_text(
    text: str = Form(...),
    metadata: Optional[str] = Form(None)
):
    try:
        metadata_dict = eval(metadata) if metadata else {}
        doc_id = ingestion_service.ingest_text(text, metadata_dict)
        return {"document_id": doc_id, "status": "success"}
    except Exception as e:
        logger.error(f"Error ingesting text: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/image")
async def ingest_image(
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None)
):
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        metadata_dict = eval(metadata) if metadata else {}
        doc_id = ingestion_service.ingest_image(str(file_path), metadata_dict)
        
        return {"document_id": doc_id, "status": "success", "file_path": str(file_path)}
    except Exception as e:
        logger.error(f"Error ingesting image: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest/multimodal")
async def ingest_multimodal(
    text: str = Form(...),
    file: UploadFile = File(...),
    metadata: Optional[str] = Form(None)
):
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        metadata_dict = eval(metadata) if metadata else {}
        doc_id = ingestion_service.ingest_multimodal(text, str(file_path), metadata_dict)
        
        return {"document_id": doc_id, "status": "success"}
    except Exception as e:
        logger.error(f"Error ingesting multimodal content: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/text")
async def search_by_text(
    query: str = Form(...),
    top_k: int = Form(10),
    content_type: Optional[str] = Form(None),
    threshold: Optional[float] = Form(0.4)
):
    try:
        content_type_enum = ContentType(content_type) if content_type else None
        
        # Create SearchQuery with threshold
        search_query = SearchQuery(
            query_text=query,
            top_k=top_k,
            content_type=content_type_enum,
            threshold=threshold
        )
        results = retrieval_service.search(search_query)
        
        return {
            "query": query,
            "results": [
                {
                    "document_id": str(result.document.id),
                    "score": result.score,
                    "content_type": result.document.content_type,
                    "text_content": result.document.text_content,
                    "image_path": result.document.image_path,
                    "metadata": result.document.metadata
                }
                for result in results
            ]
        }
    except Exception as e:
        logger.error(f"Error in text search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/image")
async def search_by_image(
    file: UploadFile = File(...),
    top_k: int = Form(10),
    content_type: Optional[str] = Form(None)
):
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / f"query_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        content_type_enum = ContentType(content_type) if content_type else None
        results = retrieval_service.search_by_image(str(file_path), top_k, content_type_enum)
        
        return {
            "query_image": str(file_path),
            "results": [
                {
                    "document_id": str(result.document.id),
                    "score": result.score,
                    "content_type": result.document.content_type,
                    "text_content": result.document.text_content,
                    "image_path": result.document.image_path,
                    "metadata": result.document.metadata
                }
                for result in results
            ]
        }
    except Exception as e:
        logger.error(f"Error in image search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/multimodal")
async def search_multimodal(
    text: str = Form(...),
    file: UploadFile = File(...),
    top_k: int = Form(10)
):
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / f"query_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        results = retrieval_service.search_multimodal(text, str(file_path), top_k)
        
        return {
            "query_text": text,
            "query_image": str(file_path),
            "results": [
                {
                    "document_id": str(result.document.id),
                    "score": result.score,
                    "content_type": result.document.content_type,
                    "text_content": result.document.text_content,
                    "image_path": result.document.image_path,
                    "metadata": result.document.metadata
                }
                for result in results
            ]
        }
    except Exception as e:
        logger.error(f"Error in multimodal search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/hybrid")
async def hybrid_search(
    text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    text_weight: float = Form(0.5),
    top_k: int = Form(10)
):
    try:
        if not text and not file:
            raise ValueError("At least one of text or image must be provided")
        
        image_path = None
        if file:
            file_path = UPLOAD_DIR / f"query_{file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            image_path = str(file_path)
        
        results = retrieval_service.hybrid_search(text, image_path, text_weight, top_k)
        
        return {
            "query_text": text,
            "query_image": image_path,
            "text_weight": text_weight,
            "results": [
                {
                    "document_id": str(result.document.id),
                    "score": result.score,
                    "content_type": result.document.content_type,
                    "text_content": result.document.text_content,
                    "image_path": result.document.image_path,
                    "metadata": result.document.metadata
                }
                for result in results
            ]
        }
    except Exception as e:
        logger.error(f"Error in hybrid search: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# Note: Disabled text search endpoint
# @app.post("/search")
# async def search_json(request: TextSearchRequest):
    try:
        content_type_enum = ContentType(request.content_type) if request.content_type else None
        results = retrieval_service.search_by_text(request.query, request.top_k, content_type_enum)
        
        return {
            "query": request.query,
            "results": [
                {
                    "document_id": str(result.document.id),
                    "score": result.score,
                    "content_type": result.document.content_type,
                    "text_content": result.document.text_content,
                    "image_path": result.document.image_path,
                    "metadata": result.document.metadata
                }
                for result in results
            ]
        }
    except Exception as e:
        logger.error(f"Error in JSON text search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Note: Disabled hybrid search endpoint
# @app.post("/search/hybrid-json")
# async def hybrid_search_json(request: HybridSearchRequest):
    try:
        import base64
        import tempfile
        from pathlib import Path
        
        if not request.text and not request.image_base64:
            raise ValueError("At least one of text or image must be provided")
        
        image_path = None
        if request.image_base64:
            image_data = base64.b64decode(request.image_base64)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                tmp_file.write(image_data)
                image_path = tmp_file.name
        
        results = retrieval_service.hybrid_search(
            request.text, 
            image_path, 
            request.text_weight, 
            request.top_k
        )
        
        if image_path and Path(image_path).exists():
            Path(image_path).unlink()
        
        return {
            "query_text": request.text,
            "text_weight": request.text_weight,
            "results": [
                {
                    "document_id": str(result.document.id),
                    "score": result.score,
                    "content_type": result.document.content_type,
                    "text_content": result.document.text_content,
                    "image_path": result.document.image_path,
                    "metadata": result.document.metadata
                }
                for result in results
            ]
        }
    except Exception as e:
        logger.error(f"Error in hybrid JSON search: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/videos/upload")
async def upload_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    metadata: Optional[str] = Form(None)
):
    try:
        metadata_dict = json.loads(metadata) if metadata else {}
        
        video_info = VideoInfo(
            title=title,
            filename=file.filename,
            file_path="",
            metadata=metadata_dict
        )
        
        video_id = str(video_info.id) if video_info.id else "temp_video_id"
        
        return {
            "video_id": video_id,
            "title": title,
            "filename": file.filename,
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error processing video info: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/frames/save")
async def save_frame(
    file: UploadFile = File(...),
    timestamp: float = Form(...),
    metadata: Optional[str] = Form(None)
):
    try:
        frame_path = UPLOAD_DIR / f"frame_{timestamp}_{file.filename}"
        with open(frame_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        metadata_dict = json.loads(metadata) if metadata else {}
        metadata_dict['timestamp'] = timestamp
        metadata_dict['content_type'] = 'frame'
        
        doc_id = ingestion_service.ingest_image(str(frame_path), metadata_dict)
        
        return {
            "frame_id": doc_id,
            "timestamp": timestamp,
            "image_path": str(frame_path),
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error saving frame: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Note: Disabled /chats/save endpoint to prevent duplicate key errors
# Only using conversation storage (Q+A+image) now



@app.post("/conversations/save")
async def save_conversation(
    request: Request,
    question: str = Form(...),
    answer: str = Form(...),
    question_image: Optional[str] = Form(None),  # base64 encoded image
    timestamp: float = Form(0.0),
    video_id: Optional[str] = Form(None)  # video identifier for shared frames
):
    try:
        user_id = get_user_id_from_request(request)
        
        # Input validation
        if not question.strip():
            raise HTTPException(status_code=400, detail="Question cannot be empty")
        if not answer.strip():
            raise HTTPException(status_code=400, detail="Answer cannot be empty")
            
        logger.info(f"Saving conversation for user {user_id}: Q='{question[:50]}...', A='{answer[:50]}...', has_image={bool(question_image)}")
        
        # Generate unique conversation ID
        import uuid
        conversation_id = f"conv_{str(uuid.uuid4())[:8]}"
        
        # Generate combined embedding using the same method as RAG
        from src.models.embeddings import MultimodalEmbedder
        embedder = MultimodalEmbedder()
        
        combined_text = f"{question.strip()} {answer.strip()}"
        combined_embedding = embedder.embed_text(combined_text)[0].tolist()
        
        # Save to user-specific conversation collection
        conversation_data = {
            "user_id": user_id,
            "conversation_id": conversation_id,
            "question": question.strip(),
            "answer": answer.strip(),
            "question_image": question_image,
            "context": {},
            "metadata": {},
            "timestamp": timestamp,
            "combined_embedding": combined_embedding,
            "tags": [],
            "created_at": datetime.utcnow()
        }
        
        result = user_conversations_collection.insert_one(conversation_data)
        
        # Process image if provided (save as shared video frame)
        shared_image_path = None
        if question_image:
            try:
                import base64
                from pathlib import Path
                import hashlib
                
                # Base64 디코딩
                image_data = base64.b64decode(question_image.split(',')[1] if ',' in question_image else question_image)
                
                # 동영상 프레임 기준으로 공유 파일명 생성
                if video_id and timestamp > 0:
                    # video_id와 timestamp를 기준으로 파일명 생성 (공유)
                    frame_filename = f"frame_{video_id}_{int(timestamp * 1000)}.jpg"
                else:
                    # video_id가 없으면 이미지 해시를 기준으로 파일명 생성
                    image_hash = hashlib.md5(image_data).hexdigest()[:12]
                    frame_filename = f"frame_unknown_{image_hash}.jpg"
                
                shared_image_path = UPLOAD_DIR / frame_filename
                
                # 파일이 이미 존재하지 않으면 저장
                if not shared_image_path.exists():
                    with open(shared_image_path, 'wb') as f:
                        f.write(image_data)
                    logger.info(f"Saved new shared frame image at: {shared_image_path}")
                else:
                    logger.info(f"Reusing existing shared frame image: {shared_image_path}")
                
                # 대화 데이터에 공유 이미지 경로 추가
                user_conversations_collection.update_one(
                    {"_id": result.inserted_id},
                    {"$set": {
                        "image_path": str(shared_image_path),
                        "video_id": video_id,
                        "shared_frame": True
                    }}
                )
                    
            except Exception as image_error:
                logger.error(f"Error processing shared frame image: {image_error}")
                # 이미지 처리 실패해도 대화 저장은 계속 진행
        
        return {
            "conversation_id": conversation_id,
            "document_id": str(result.inserted_id),
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/conversations/search")
async def search_conversations(http_request: Request, request: ConversationSearchRequest):
    try:
        user_id = get_user_id_from_request(http_request)
        
        # Validate request
        if not request.query:
            raise HTTPException(status_code=400, detail="Query cannot be empty")
        
        if not isinstance(request.query, str):
            raise HTTPException(status_code=400, detail=f"Query must be string, got {type(request.query)}")
            
        if request.top_k <= 0 or request.top_k > 100:
            raise HTTPException(status_code=400, detail="top_k must be between 1 and 100")
            
        logger.info(f"Conversation search request for user {user_id}: query='{request.query[:50]}...', top_k={request.top_k}")
        
        # Use vector similarity search like RAG system
        from src.models.embeddings import MultimodalEmbedder
        import numpy as np
        
        # Generate query embedding
        embedder = MultimodalEmbedder()
        query_embedding = embedder.embed_text(request.query.strip())[0]
        
        # Get all user conversations
        conversations = list(user_conversations_collection.find({"user_id": user_id}))
        logger.info(f"Found {len(conversations)} conversations to search for user {user_id}")
        
        if not conversations:
            logger.info("No conversations found for user")
            return {"query": request.query, "results": []}
        
        results = []
        for conv in conversations:
            try:
                # Check if combined_embedding exists
                if not conv.get('combined_embedding'):
                    logger.warning(f"Conversation {conv.get('conversation_id')} has no combined_embedding, skipping")
                    continue
                    
                # Convert embedding to numpy array
                doc_embedding = np.array(conv['combined_embedding'])
                if doc_embedding.size == 0:
                    continue
                
                # Compute similarity using the same method as RAG system
                similarity = embedder.compute_similarity(
                    query_embedding.reshape(1, -1), 
                    doc_embedding.reshape(1, -1)
                )[0]
                
                if np.isnan(similarity) or np.isinf(similarity):
                    similarity = 0.0
                
                # Apply threshold filter (0.4 = 40%)
                if similarity >= 0.4:
                    results.append({
                        "conversation_id": str(conv.get("conversation_id", "")),
                        "question": str(conv.get("question", "")),
                        "answer": str(conv.get("answer", "")),
                        "question_image": conv.get("question_image"),
                        "score": float(similarity),
                        "timestamp": float(conv.get("timestamp", 0.0))
                    })
                
            except Exception as result_error:
                logger.error(f"Error processing conversation {conv.get('conversation_id', 'unknown')}: {result_error}")
                continue
        
        # Sort by similarity score (descending) and return top_k
        results.sort(key=lambda x: x['score'], reverse=True)
        final_results = results[:request.top_k]
        
        response_data = {
            "query": request.query,
            "results": final_results
        }
        
        logger.info(f"Successfully processed {len(final_results)} conversation search results for user {user_id}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching conversations: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/conversations/history")
async def get_conversation_history(request: Request, limit: int = 50, offset: int = 0):
    try:
        user_id = get_user_id_from_request(request)
        
        conversations = list(user_conversations_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(offset).limit(limit))
        
        # Convert ObjectId to string
        for conv in conversations:
            conv["_id"] = str(conv["_id"])
            if "created_at" in conv:
                conv["created_at"] = conv["created_at"].isoformat()
        
        return {
            "user_id": user_id,
            "conversations": conversations,
            "total": user_conversations_collection.count_documents({"user_id": user_id}),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error getting conversation history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Note: Removed get_conversations_by_video endpoint as we simplified to not use video_id


@app.post("/chatrooms/save")
async def save_chat_room(http_request: Request, request: ChatRoomSaveRequest):
    try:
        user_id = get_user_id_from_request(http_request)
        
        # Save chat room data to MongoDB with user isolation
        chat_room_data = {
            "user_id": user_id,
            "room_id": request.room_id,
            "name": request.name,
            "description": "",
            "messages": request.messages,
            "video_context": {
                "video_id": request.video_id,
                "captured_frame": request.captured_frame,
                "frame_time": request.frame_time,
                "video_current_time": request.video_current_time
            },
            "captured_frame": request.captured_frame,
            "frame_time": request.frame_time,
            "video_current_time": request.video_current_time,
            "video_id": request.video_id,
            "stats": {
                "message_count": len(request.messages) if request.messages else 0
            },
            "is_archived": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Check if chat room already exists for this user
        existing_room = user_chat_rooms_collection.find_one({
            "user_id": user_id,
            "room_id": request.room_id
        })
        
        if existing_room:
            # Update existing room
            chat_room_data["updated_at"] = datetime.utcnow()
            chat_room_data["stats"]["message_count"] = len(request.messages) if request.messages else 0
            
            result = user_chat_rooms_collection.update_one(
                {"user_id": user_id, "room_id": request.room_id},
                {"$set": chat_room_data}
            )
            return {
                "room_id": request.room_id,
                "status": "updated",
                "modified_count": result.modified_count
            }
        else:
            # Create new room
            result = user_chat_rooms_collection.insert_one(chat_room_data)
            return {
                "room_id": request.room_id,
                "status": "created",
                "document_id": str(result.inserted_id)
            }
            
    except Exception as e:
        logger.error(f"Error saving chat room: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chatrooms/{video_id}")
async def get_chat_rooms_by_video(request: Request, video_id: str):
    try:
        user_id = get_user_id_from_request(request)
        
        chat_rooms = list(user_chat_rooms_collection.find({
            "user_id": user_id,
            "video_id": video_id
        }))
        
        # Convert ObjectId to string and datetime to isoformat for JSON serialization
        for room in chat_rooms:
            room["_id"] = str(room["_id"])
            if "created_at" in room:
                room["created_at"] = room["created_at"].isoformat()
            if "updated_at" in room:
                room["updated_at"] = room["updated_at"].isoformat()
        
        return {
            "user_id": user_id,
            "video_id": video_id,
            "chat_rooms": chat_rooms
        }
    except Exception as e:
        logger.error(f"Error getting chat rooms: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chatrooms")
async def get_all_chat_rooms(request: Request, limit: int = 50, offset: int = 0):
    try:
        user_id = get_user_id_from_request(request)
        
        chat_rooms = list(user_chat_rooms_collection.find({
            "user_id": user_id,
            "is_archived": False
        }).sort("updated_at", -1).skip(offset).limit(limit))
        
        # Convert ObjectId to string and datetime to isoformat for JSON serialization
        for room in chat_rooms:
            room["_id"] = str(room["_id"])
            if "created_at" in room:
                room["created_at"] = room["created_at"].isoformat()
            if "updated_at" in room:
                room["updated_at"] = room["updated_at"].isoformat()
        
        return {
            "user_id": user_id,
            "chat_rooms": chat_rooms,
            "total": user_chat_rooms_collection.count_documents({
                "user_id": user_id,
                "is_archived": False
            }),
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        logger.error(f"Error getting all chat rooms: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/chatrooms/{room_id}")
async def delete_chat_room(request: Request, room_id: str):
    try:
        user_id = get_user_id_from_request(request)
        
        # First check if chat room exists
        existing_room = user_chat_rooms_collection.find_one({
            "user_id": user_id,
            "room_id": room_id
        })
        
        if not existing_room:
            raise HTTPException(status_code=404, detail="Chat room not found or access denied")
        
        # Delete chat room from user_chat_rooms_collection
        room_result = user_chat_rooms_collection.delete_one({
            "user_id": user_id,
            "room_id": room_id
        })
        
        # Delete related conversations and images more precisely
        # Instead of using timestamp matching, we'll track conversations by chat room context
        video_id = existing_room.get("video_id")
        video_current_time = existing_room.get("video_current_time")
        captured_frame = existing_room.get("captured_frame")
        
        conversations_deleted = 0
        images_deleted = 0
        
        # Delete conversations that have the same frame/context as this chat room
        if captured_frame or (video_id and video_current_time is not None):
            delete_query = {"user_id": user_id}
            
            # More precise matching: use exact timestamp match if available
            if video_current_time is not None:
                delete_query["timestamp"] = video_current_time
            
            # Find conversations to delete and their associated images before deleting
            conversations_to_delete = list(user_conversations_collection.find(delete_query))
            
            # Delete associated image files
            for conv in conversations_to_delete:
                image_path = conv.get("image_path")
                if image_path:
                    try:
                        from pathlib import Path
                        file_path = Path(image_path)
                        if file_path.exists():
                            file_path.unlink()
                            images_deleted += 1
                            logger.info(f"Deleted image file: {image_path}")
                    except Exception as img_error:
                        logger.error(f"Error deleting image {image_path}: {img_error}")
            
            # Delete the conversations
            if conversations_to_delete:
                conv_result = user_conversations_collection.delete_many(delete_query)
                conversations_deleted = conv_result.deleted_count
        
        logger.info(f"Deleted chat room {room_id} for user {user_id}, also deleted {conversations_deleted} related conversations and {images_deleted} images")
        
        if room_result.deleted_count > 0:
            return {
                "room_id": room_id, 
                "status": "deleted",
                "chat_room_deleted": True,
                "conversations_deleted": conversations_deleted,
                "images_deleted": images_deleted
            }
        else:
            raise HTTPException(status_code=404, detail="Chat room not found or access denied")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat room: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chatrooms/{room_id}/details")
async def get_chat_room_details(request: Request, room_id: str):
    try:
        user_id = get_user_id_from_request(request)
        
        room = user_chat_rooms_collection.find_one({
            "user_id": user_id,
            "room_id": room_id
        })
        
        if not room:
            raise HTTPException(status_code=404, detail="Chat room not found or access denied")
        
        # Convert ObjectId to string and datetime to isoformat
        room["_id"] = str(room["_id"])
        if "created_at" in room:
            room["created_at"] = room["created_at"].isoformat()
        if "updated_at" in room:
            room["updated_at"] = room["updated_at"].isoformat()
        
        return room
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat room details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class OpenAIChatRequest(BaseModel):
    message: str
    captured_frame: Optional[str] = None
    video_file_name: Optional[str] = None

@app.post("/openai/chat")
async def openai_chat(request: Request, chat_request: OpenAIChatRequest):
    try:
        user_id = get_user_id_from_request(request)
        
        # Get user's stored API key
        user = users_collection.find_one({"user_id": user_id})
        if not user or not user.get("openai_api_key"):
            raise HTTPException(status_code=400, detail="OpenAI API key not found. Please set your API key first.")
        
        # Decrypt API key
        import base64
        try:
            encrypted_key = user["openai_api_key"]
            api_key = base64.b64decode(encrypted_key.encode()).decode()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid API key format. Please reset your API key.")
        
        # Initialize OpenAI client
        import openai
        client = openai.OpenAI(api_key=api_key)
        
        # Build messages
        messages = [
            {
                "role": "system",
                "content": f"당신은 비디오 분석 전문 AI입니다. 사용자가 업로드한 영상에 대해 질문하면 도움이 되는 답변을 해주세요. 현재 업로드된 영상: {chat_request.video_file_name or '없음'}{'. 현재 일시정지된 화면의 스크린샷이 함께 제공됩니다.' if chat_request.captured_frame else ''}"
            }
        ]
        
        # Add user message with or without image
        if chat_request.captured_frame:
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": chat_request.message
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": chat_request.captured_frame,
                            "detail": "high"
                        }
                    }
                ]
            })
        else:
            messages.append({
                "role": "user",
                "content": chat_request.message
            })
        
        # Call OpenAI API
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                max_tokens=500,
                temperature=0.7
            )
            
            ai_response = response.choices[0].message.content
            
            return {
                "message": ai_response,
                "status": "success"
            }
            
        except openai.AuthenticationError:
            raise HTTPException(status_code=401, detail="Invalid OpenAI API key. Please check your API key.")
        except openai.RateLimitError:
            raise HTTPException(status_code=429, detail="OpenAI API rate limit exceeded. Please try again later.")
        except Exception as openai_error:
            logger.error(f"OpenAI API error: {openai_error}")
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(openai_error)}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in OpenAI chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)