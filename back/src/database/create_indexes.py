#!/usr/bin/env python3
"""
Database index creation script for user-specific collections
Run this script to create all necessary indexes for optimal performance
"""

import os
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent.parent
sys.path.append(str(project_root))

from src.database.mongodb_client import MongoDBClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_indexes():
    """Create all necessary indexes for user-specific collections"""
    
    # Connect to MongoDB
    db_client = MongoDBClient()
    if not db_client.connect():
        logger.error("Failed to connect to MongoDB")
        return False
    
    try:
        # Get collections
        users_collection = db_client.get_collection("users")
        user_conversations_collection = db_client.get_collection("user_conversations")
        user_chat_rooms_collection = db_client.get_collection("user_chat_rooms")
        
        logger.info("Creating indexes for users collection...")
        
        # Users collection indexes
        users_collection.create_index("user_id", unique=True, name="idx_user_id")
        users_collection.create_index("email", unique=True, sparse=True, name="idx_email")
        users_collection.create_index([("last_login", -1)], name="idx_last_login")
        users_collection.create_index("login_type", name="idx_login_type")
        
        logger.info("Creating indexes for user_conversations collection...")
        
        # User conversations collection indexes
        user_conversations_collection.create_index(
            [("user_id", 1), ("created_at", -1)], 
            name="idx_user_conversations"
        )
        user_conversations_collection.create_index(
            "conversation_id", 
            unique=True, 
            name="idx_conversation_id"
        )
        user_conversations_collection.create_index(
            [("user_id", 1), ("tags", 1)], 
            name="idx_user_tags"
        )
        
        # Text search index for conversations
        from pymongo import TEXT
        user_conversations_collection.create_index(
            [("question", TEXT), ("answer", TEXT)],
            name="idx_conversation_text_search"
        )
        
        # Index for timestamp-based queries
        user_conversations_collection.create_index(
            [("user_id", 1), ("timestamp", -1)],
            name="idx_user_timestamp"
        )
        
        logger.info("Creating indexes for user_chat_rooms collection...")
        
        # User chat rooms collection indexes
        user_chat_rooms_collection.create_index(
            [("user_id", 1), ("updated_at", -1)], 
            name="idx_user_chatrooms"
        )
        user_chat_rooms_collection.create_index(
            "room_id", 
            unique=True, 
            name="idx_room_id"
        )
        user_chat_rooms_collection.create_index(
            [("user_id", 1), ("is_archived", 1)], 
            name="idx_user_active_rooms"
        )
        user_chat_rooms_collection.create_index(
            [("user_id", 1), ("video_id", 1)],
            name="idx_user_video_rooms"
        )
        
        # Compound index for room details access
        user_chat_rooms_collection.create_index(
            [("user_id", 1), ("room_id", 1)],
            name="idx_user_room_access"
        )
        
        logger.info("All indexes created successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        return False
    finally:
        db_client.close()


def list_indexes():
    """List all indexes in user-specific collections"""
    
    db_client = MongoDBClient()
    if not db_client.connect():
        logger.error("Failed to connect to MongoDB")
        return
    
    try:
        collections = [
            ("users", db_client.get_collection("users")),
            ("user_conversations", db_client.get_collection("user_conversations")),
            ("user_chat_rooms", db_client.get_collection("user_chat_rooms"))
        ]
        
        for collection_name, collection in collections:
            logger.info(f"\nIndexes for {collection_name}:")
            for index in collection.list_indexes():
                logger.info(f"  - {index['name']}: {index.get('key', {})}")
                
    except Exception as e:
        logger.error(f"Error listing indexes: {e}")
    finally:
        db_client.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Manage MongoDB indexes")
    parser.add_argument("--create", action="store_true", help="Create indexes")
    parser.add_argument("--list", action="store_true", help="List existing indexes")
    
    args = parser.parse_args()
    
    if args.create:
        if create_indexes():
            logger.info("Index creation completed successfully")
        else:
            logger.error("Index creation failed")
            sys.exit(1)
    elif args.list:
        list_indexes()
    else:
        logger.info("Use --create to create indexes or --list to list existing indexes")