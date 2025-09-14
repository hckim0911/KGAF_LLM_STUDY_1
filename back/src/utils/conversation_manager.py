import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from ..database.mongodb_client import MongoDBClient
from ..database.schemas import ConversationData, ConversationSearchRequest, ConversationSearchResult
from ..models.embeddings import MultimodalEmbedder
import numpy as np

logger = logging.getLogger(__name__)


class ConversationManager:
    def __init__(self):
        try:
            logger.info("Initializing ConversationManager...")
            self.db_client = MongoDBClient()
            self.db_client.connect()
            self.collection = self.db_client.get_collection("conversations")
            logger.info(f"Connected to conversations collection: {self.collection}")
            
            self.embedder = MultimodalEmbedder()
            logger.info("MultimodalEmbedder initialized")
            
            self._create_indexes()
            logger.info("ConversationManager initialization complete")
        except Exception as e:
            logger.error(f"Error initializing ConversationManager: {e}")
            raise
    
    def _create_indexes(self):
        self.collection.create_index("video_id")
        self.collection.create_index("timestamp")
        self.collection.create_index("chat_room_id")
        self.collection.create_index("created_at")
        logger.info("Created conversation indexes")
    
    def save_conversation(self, question: str, answer: str, question_image: Optional[str] = None, 
                         timestamp: float = 0.0) -> str:
        combined_text = f"{question} {answer}"
        
        question_embedding = self.embedder.embed_text(question)[0].tolist()
        answer_embedding = self.embedder.embed_text(answer)[0].tolist()
        combined_embedding = self.embedder.embed_text(combined_text)[0].tolist()
        
        # Create a unique filter to prevent duplicates
        filter_query = {
            "question": question,
            "answer": answer,
            "timestamp": timestamp
        }
        
        conversation_data = {
            "question": question,
            "answer": answer,
            "question_image": question_image,
            "timestamp": timestamp,
            "question_embedding": question_embedding,
            "answer_embedding": answer_embedding,
            "combined_embedding": combined_embedding,
            "created_at": datetime.utcnow()
        }
        
        # Use upsert to update if exists, insert if not
        result = self.collection.update_one(
            filter_query,
            {"$set": conversation_data},
            upsert=True
        )
        
        if result.upserted_id:
            logger.info(f"Saved new conversation with ID: {result.upserted_id}")
            return str(result.upserted_id)
        else:
            # Find the existing document to get its ID
            existing_doc = self.collection.find_one(filter_query)
            logger.info(f"Updated existing conversation with ID: {existing_doc['_id']}")
            return str(existing_doc['_id'])
    
    def search_conversations(self, query: str, top_k: int = 10) -> List[ConversationSearchResult]:
        try:
            # Validate input
            if not query or not isinstance(query, str):
                raise ValueError(f"Query must be a valid string, got: {type(query)} - {query}")
            
            if not query.strip():
                logger.warning("Empty query provided, returning empty results")
                return []
                
            logger.info(f"Searching conversations for query: '{query[:50]}...'")    
            
            # Generate query embedding
            try:
                query_embedding = self.embedder.embed_text(query.strip())[0]
            except Exception as e:
                logger.error(f"Error generating query embedding: {e}")
                raise
            
            # Find all conversations
            conversations = list(self.collection.find({}))
            logger.info(f"Found {len(conversations)} conversations to search")
            
            if not conversations:
                logger.info("No conversations found")
                return []
            
            results = []
            for i, conv in enumerate(conversations):
                try:
                    # Validate conversation data
                    if not conv.get('_id'):
                        logger.warning(f"Conversation {i} missing _id, skipping")
                        continue
                    
                    # Convert ObjectId to string for Pydantic validation
                    conv_data = conv.copy()
                    if '_id' in conv_data:
                        conv_data['_id'] = str(conv_data['_id'])
                        
                    # Create conversation object
                    conv_obj = ConversationData(**conv_data)
                    
                    # Check if embedding exists
                    if not conv_obj.combined_embedding:
                        logger.warning(f"Conversation {conv_obj.id} has no combined_embedding, skipping")
                        continue
                        
                    # Convert embedding to numpy array
                    try:
                        doc_embedding = np.array(conv_obj.combined_embedding)
                        if doc_embedding.size == 0:
                            logger.warning(f"Conversation {conv_obj.id} has empty embedding, skipping")
                            continue
                    except Exception as e:
                        logger.error(f"Error converting embedding for conversation {conv_obj.id}: {e}")
                        continue
                    
                    # Compute similarity
                    try:
                        similarity = self.embedder.compute_similarity(
                            query_embedding.reshape(1, -1), 
                            doc_embedding.reshape(1, -1)
                        )[0]
                        
                        if np.isnan(similarity) or np.isinf(similarity):
                            logger.warning(f"Invalid similarity score for conversation {conv_obj.id}: {similarity}")
                            similarity = 0.0
                            
                    except Exception as e:
                        logger.error(f"Error computing similarity for conversation {conv_obj.id}: {e}")
                        similarity = 0.0
                    
                    # Create search result
                    results.append(ConversationSearchResult(
                        conversation_id=str(conv_obj.id),
                        question=conv_obj.question or '',
                        answer=conv_obj.answer or '',
                        question_image=conv_obj.question_image,
                        score=float(similarity),
                        timestamp=conv_obj.timestamp or 0.0
                    ))
                    
                except Exception as e:
                    logger.error(f"Error processing conversation {i}: {e}")
                    continue
            
            # Sort results by similarity score
            results.sort(key=lambda x: x.score, reverse=True)
            final_results = results[:top_k]
            
            logger.info(f"Returning {len(final_results)} search results")
            return final_results
            
        except Exception as e:
            logger.error(f"Error in search_conversations: {e}")
            raise
    
    def delete_conversation(self, conversation_id: str) -> bool:
        result = self.collection.delete_one({"_id": conversation_id})
        return result.deleted_count > 0