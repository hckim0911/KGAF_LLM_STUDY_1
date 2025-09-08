import os
from pathlib import Path

# Base directory (back/)
BASE_DIR = Path(__file__).parent.parent.parent

# Data directories
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = DATA_DIR / "models"
DB_DIR = DATA_DIR / "db"
CACHE_DIR = DATA_DIR / "cache" 
UPLOADS_DIR = DATA_DIR / "uploads"

# Model cache directories
CLIP_CACHE_DIR = MODELS_DIR / "clip"
TEXT_CACHE_DIR = MODELS_DIR / "text"
TRANSFORMERS_CACHE_DIR = MODELS_DIR / "cache"

# Model names
CLIP_MODEL_NAME = "openai/clip-vit-base-patch32"
TEXT_MODEL_NAME = "BAAI/bge-m3"

# MongoDB configuration
MONGODB_URI = f"mongodb://localhost:27017/?directConnection=true"
MONGODB_DB_NAME = "multimodal_rag"
MONGODB_DATA_DIR = DB_DIR / "mongodb"

# API configuration
API_HOST = "0.0.0.0"
API_PORT = 8000

# Logging configuration
LOG_LEVEL = "INFO"
LOG_DIR = DATA_DIR / "logs"
LOG_FILE = LOG_DIR / "app.log"

def ensure_directories():
    """Create all necessary directories if they don't exist"""
    directories = [
        DATA_DIR, MODELS_DIR, DB_DIR, CACHE_DIR, UPLOADS_DIR,
        CLIP_CACHE_DIR, TEXT_CACHE_DIR, TRANSFORMERS_CACHE_DIR, LOG_DIR, MONGODB_DATA_DIR
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
    
    print(f"Data directories ensured at: {DATA_DIR}")
    print(f"MongoDB data directory: {MONGODB_DATA_DIR}")
    print(f"Log directory: {LOG_DIR}")

def setup_environment():
    """Setup environment variables for model caching"""
    ensure_directories()
    
    # Set transformers cache
    os.environ['TRANSFORMERS_CACHE'] = str(TRANSFORMERS_CACHE_DIR)
    os.environ['HF_HOME'] = str(TRANSFORMERS_CACHE_DIR)
    
    print(f"Environment setup complete:")
    print(f"  TRANSFORMERS_CACHE: {TRANSFORMERS_CACHE_DIR}")
    print(f"  HF_HOME: {TRANSFORMERS_CACHE_DIR}")

# Initialize on import
setup_environment()