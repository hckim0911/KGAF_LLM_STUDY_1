from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ContentType(str, Enum):
    TEXT = "text"
    FRAME = "frame"
    CHAT = "chat"
    MULTIMODAL = "multimodal"
    VIDEO = "video"


class Document(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    content_type: ContentType
    text_content: Optional[str] = None
    image_path: Optional[str] = None
    image_url: Optional[str] = None
    text_embedding: Optional[List[float]] = None
    image_embedding: Optional[List[float]] = None
    multimodal_embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class SearchQuery(BaseModel):
    query_text: Optional[str] = None
    query_image_path: Optional[str] = None
    query_image_url: Optional[str] = None
    content_type: Optional[ContentType] = None
    top_k: int = 10
    threshold: Optional[float] = None
    metadata_filter: Optional[Dict[str, Any]] = None


class SearchResult(BaseModel):
    document: Document
    score: float
    distance: float


class VideoInfo(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    filename: str
    file_path: str
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class FrameData(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    video_id: str
    frame_number: int
    timestamp: float
    image_path: str
    image_embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChatData(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    video_id: str
    frame_id: Optional[str] = None
    timestamp: float
    chat_text: str
    username: Optional[str] = None
    text_embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


# User Management Schemas
class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str  # Unique identifier from frontend
    name: str
    email: str
    login_type: str = Field(default="local")  # "google" | "local"
    profile_image: Optional[str] = None
    is_active: bool = Field(default=True)
    preferences: Dict[str, Any] = Field(default_factory=dict)
    openai_api_key: Optional[str] = None  # Encrypted API key storage
    api_key_validated: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserRegistrationRequest(BaseModel):
    user_id: str
    name: str
    email: str
    login_type: str = "local"
    profile_image: Optional[str] = None


class UserLoginRequest(BaseModel):
    user_id: str
    name: Optional[str] = None
    email: Optional[str] = None


class OpenAIKeyRequest(BaseModel):
    api_key: str


class OpenAIKeyTestRequest(BaseModel):
    api_key: str
    test_message: str = "Hello, this is a test message."


class ConversationData(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str  # Added user_id field
    conversation_id: str
    question: str
    answer: str
    question_image: Optional[str] = None  # base64 encoded image
    context: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float = Field(default=0.0)
    question_embedding: Optional[List[float]] = None
    answer_embedding: Optional[List[float]] = None
    combined_embedding: Optional[List[float]] = None
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ConversationSearchRequest(BaseModel):
    query: str
    top_k: int = 10


class ConversationSearchResult(BaseModel):
    conversation_id: str
    question: str
    answer: str
    question_image: Optional[str] = None  # base64 encoded image
    score: float
    timestamp: float


class ChatRoomData(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str  # Added user_id field
    room_id: str
    name: str
    description: Optional[str] = None
    messages: List[Dict[str, Any]] = Field(default_factory=list)
    video_context: Dict[str, Any] = Field(default_factory=dict)
    captured_frame: Optional[str] = None
    frame_time: Optional[str] = None
    video_current_time: Optional[float] = None
    video_id: Optional[str] = None
    stats: Dict[str, Any] = Field(default_factory=dict)
    is_archived: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }