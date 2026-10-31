import logging
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings

logger = logging.getLogger("kisanrakshak.database")

class DatabaseManager:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    # In-memory memory fallback store when MongoDB Atlas connection string is not provided
    memory_store: Dict[str, List[Dict[str, Any]]] = {
        "farmers": [],
        "crop_reports": [],
        "advisories": [],
        "farms": []
    }

    async def connect_to_database(self):
        if settings.MONGODB_URI and "mongodb" in settings.MONGODB_URI:
            try:
                self.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
                self.db = self.client[settings.DATABASE_NAME]
                # Test connection
                await self.client.admin.command('ping')
                logger.info("Connected successfully to MongoDB Atlas.")
            except Exception as e:
                logger.warning(f"MongoDB connection failed: {e}. Utilizing resilient in-memory data store.")
                self.client = None
                self.db = None
        else:
            logger.info("MONGODB_URI not configured. Running in-memory data store mode.")

    async def close_database_connection(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

db_manager = DatabaseManager()

def get_database() -> DatabaseManager:
    return db_manager
