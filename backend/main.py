from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
import os
from dotenv import load_dotenv
import asyncio
import logging
from datetime import datetime
import httpx

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GitNest API",
    description="API for visualizing GitHub repository structures",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://git-nest-pratikpaudels-projects.vercel.app",
        "https://git-nest.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api")

async def keep_alive():
    """Background task to keep the server alive"""
    url = "https://gitnest-185c.onrender.com/api/health"
    async with httpx.AsyncClient() as client:
        while True:
            try:
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                logger.info(f"⏰ Ping attempt at: {current_time}")
                
                response = await client.get(url)
                if response.status_code == 200:
                    logger.info("✅ Keep-alive ping successful")
                else:
                    logger.warning(f"⚠️ Keep-alive ping returned status code: {response.status_code}")
                
                # Wait for 14 minutes
                await asyncio.sleep(14 * 60)
            except Exception as e:
                logger.error(f"❌ Keep-alive ping failed: {str(e)}")
                # On error, wait 30 seconds before retry
                await asyncio.sleep(30)

@app.on_event("startup")
async def startup_event():
    """Start background tasks when the app starts"""
    asyncio.create_task(keep_alive())

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True
    )
