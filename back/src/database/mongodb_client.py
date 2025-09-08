import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from typing import Optional, Dict, Any
import logging
from ..config import settings

logger = logging.getLogger(__name__)


class MongoDBClient:
    def __init__(self):
        self.client: Optional[MongoClient] = None
        self.db = None
        self.collection = None
        
    def connect(self) -> bool:
        try:
            self.client = MongoClient(settings.MONGODB_URI)
            self.client.admin.command('ping')
            self.db = self.client[settings.MONGODB_DB_NAME]
            
            logger.info(f"Successfully connected to MongoDB: {settings.MONGODB_URI} -> {settings.MONGODB_DB_NAME}")
            logger.info(f"MongoDB data will be stored in: {settings.DB_DIR}")
            return True
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            logger.info(f"Make sure MongoDB is running and accessible at {settings.MONGODB_URI}")
            return False
    
    def get_collection(self, collection_name: str):
        if self.db is None:
            self.connect()
        return self.db[collection_name]
    
    def close(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")