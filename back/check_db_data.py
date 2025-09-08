#!/usr/bin/env python3
"""
MongoDB 데이터베이스 내용 확인 스크립트
유저별 데이터와 대화기록을 조회할 수 있습니다.
"""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent
sys.path.append(str(project_root))

from src.database.mongodb_client import MongoDBClient
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.WARNING)  # Only show warnings/errors
logger = logging.getLogger(__name__)

def format_datetime(dt):
    """Format datetime for display"""
    if isinstance(dt, datetime):
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    return str(dt)

def check_all_data():
    """모든 컬렉션의 데이터 확인"""
    try:
        print("🔗 MongoDB 연결 중...")
        db_client = MongoDBClient()
        db_client.connect()
        
        # 모든 컬렉션 조회
        collections = {
            "users": db_client.get_collection("users"),
            "user_conversations": db_client.get_collection("user_conversations"),
            "user_chat_rooms": db_client.get_collection("user_chat_rooms"),
            "multimodal_documents": db_client.get_collection("multimodal_documents")
        }
        
        print("\n" + "="*80)
        print("📊 DATABASE OVERVIEW")
        print("="*80)
        
        # 각 컬렉션의 문서 수 확인
        for name, collection in collections.items():
            count = collection.count_documents({})
            print(f"{name:<20} : {count:>5} documents")
        
        print("\n" + "="*80)
        print("👥 USERS")
        print("="*80)
        
        users = list(collections["users"].find({}))
        if users:
            for user in users:
                print(f"User ID: {user.get('user_id')}")
                print(f"  Name: {user.get('name')}")
                print(f"  Email: {user.get('email')}")
                print(f"  Login Type: {user.get('login_type')}")
                print(f"  Has API Key: {bool(user.get('openai_api_key'))}")
                print(f"  Created: {format_datetime(user.get('created_at'))}")
                print(f"  Last Login: {format_datetime(user.get('last_login'))}")
                print("-" * 40)
        else:
            print("No users found")
        
        print("\n" + "="*80)
        print("💬 CONVERSATIONS BY USER")
        print("="*80)
        
        conversations = list(collections["user_conversations"].find({}))
        if conversations:
            # 유저별로 그룹화
            users_convs = {}
            for conv in conversations:
                user_id = conv.get('user_id', 'unknown')
                if user_id not in users_convs:
                    users_convs[user_id] = []
                users_convs[user_id].append(conv)
            
            for user_id, user_convs in users_convs.items():
                print(f"\n👤 User: {user_id} ({len(user_convs)} conversations)")
                print("-" * 50)
                
                for conv in user_convs[-5:]:  # Show last 5 conversations
                    print(f"  Conv ID: {conv.get('conversation_id')}")
                    print(f"  Q: {conv.get('question', '')[:60]}{'...' if len(conv.get('question', '')) > 60 else ''}")
                    print(f"  A: {conv.get('answer', '')[:60]}{'...' if len(conv.get('answer', '')) > 60 else ''}")
                    print(f"  Has Image: {bool(conv.get('question_image'))}")
                    print(f"  Has Embedding: {bool(conv.get('combined_embedding'))}")
                    print(f"  Video ID: {conv.get('video_id', 'N/A')}")
                    print(f"  Timestamp: {conv.get('timestamp')}")
                    print(f"  Created: {format_datetime(conv.get('created_at'))}")
                    print()
                
                if len(user_convs) > 5:
                    print(f"  ... and {len(user_convs) - 5} more conversations")
        else:
            print("No conversations found")
        
        print("\n" + "="*80)
        print("🏠 CHAT ROOMS BY USER")
        print("="*80)
        
        chat_rooms = list(collections["user_chat_rooms"].find({}))
        if chat_rooms:
            # 유저별로 그룹화
            users_rooms = {}
            for room in chat_rooms:
                user_id = room.get('user_id', 'unknown')
                if user_id not in users_rooms:
                    users_rooms[user_id] = []
                users_rooms[user_id].append(room)
            
            for user_id, user_rooms in users_rooms.items():
                print(f"\n👤 User: {user_id} ({len(user_rooms)} chat rooms)")
                print("-" * 50)
                
                for room in user_rooms:
                    print(f"  Room ID: {room.get('room_id')}")
                    print(f"  Name: {room.get('name')}")
                    print(f"  Messages: {len(room.get('messages', []))}")
                    print(f"  Video ID: {room.get('video_id', 'N/A')}")
                    print(f"  Created: {format_datetime(room.get('created_at'))}")
                    print(f"  Updated: {format_datetime(room.get('updated_at'))}")
                    print()
        else:
            print("No chat rooms found")
        
        print("\n" + "="*80)
        print("📄 RAG DOCUMENTS")
        print("="*80)
        
        docs = list(collections["multimodal_documents"].find({}))
        if docs:
            for doc in docs[:5]:  # Show first 5 docs
                print(f"Doc ID: {doc.get('_id')}")
                print(f"  Content Type: {doc.get('content_type')}")
                print(f"  Text: {doc.get('text_content', '')[:60]}{'...' if len(doc.get('text_content', '')) > 60 else ''}")
                print(f"  Has Embeddings: Text={bool(doc.get('text_embedding'))}, Image={bool(doc.get('image_embedding'))}")
                print(f"  Metadata: {doc.get('metadata', {})}")
                print()
            
            if len(docs) > 5:
                print(f"... and {len(docs) - 5} more documents")
        else:
            print("No RAG documents found")
        
        print("\n" + "="*80)
        print("✅ 데이터베이스 확인 완료!")
        print("="*80)
        
    except Exception as e:
        logger.error(f"❌ Error checking database: {e}")
        sys.exit(1)
        
    finally:
        try:
            db_client.close()
        except:
            pass

def check_specific_user(user_id):
    """특정 유저의 데이터만 확인"""
    try:
        print(f"🔗 특정 유저 데이터 조회: {user_id}")
        db_client = MongoDBClient()
        db_client.connect()
        
        # 유저 정보
        users_collection = db_client.get_collection("users")
        user = users_collection.find_one({"user_id": user_id})
        
        if not user:
            print(f"❌ 유저 '{user_id}'를 찾을 수 없습니다.")
            return
        
        print("\n👤 USER INFO")
        print("-" * 40)
        print(f"Name: {user.get('name')}")
        print(f"Email: {user.get('email')}")
        print(f"Login Type: {user.get('login_type')}")
        print(f"Has API Key: {bool(user.get('openai_api_key'))}")
        print(f"Created: {format_datetime(user.get('created_at'))}")
        
        # 대화 내역
        conversations_collection = db_client.get_collection("user_conversations")
        conversations = list(conversations_collection.find({"user_id": user_id}).sort("created_at", -1))
        
        print(f"\n💬 CONVERSATIONS ({len(conversations)})")
        print("-" * 40)
        for conv in conversations:
            print(f"Conv ID: {conv.get('conversation_id')}")
            print(f"  Q: {conv.get('question')}")
            print(f"  A: {conv.get('answer')[:100]}{'...' if len(conv.get('answer', '')) > 100 else ''}")
            print(f"  Has Image: {bool(conv.get('question_image'))}")
            print(f"  Video ID: {conv.get('video_id', 'N/A')}")
            print(f"  Created: {format_datetime(conv.get('created_at'))}")
            print()
        
        # 채팅룸
        chat_rooms_collection = db_client.get_collection("user_chat_rooms")
        rooms = list(chat_rooms_collection.find({"user_id": user_id}).sort("updated_at", -1))
        
        print(f"\n🏠 CHAT ROOMS ({len(rooms)})")
        print("-" * 40)
        for room in rooms:
            print(f"Room ID: {room.get('room_id')}")
            print(f"  Name: {room.get('name')}")
            print(f"  Messages: {len(room.get('messages', []))}")
            print(f"  Video ID: {room.get('video_id', 'N/A')}")
            print(f"  Updated: {format_datetime(room.get('updated_at'))}")
            print()
        
    except Exception as e:
        logger.error(f"❌ Error checking user data: {e}")
        
    finally:
        try:
            db_client.close()
        except:
            pass

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # 특정 유저 조회
        user_id = sys.argv[1]
        check_specific_user(user_id)
    else:
        # 전체 데이터 조회
        check_all_data()
        
        print("\n💡 사용법:")
        print("  전체 데이터 조회: python check_db_data.py")
        print("  특정 유저 조회: python check_db_data.py <user_id>")