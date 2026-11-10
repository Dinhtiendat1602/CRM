from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router
from config.settings import settings

app = FastAPI(
    title="Zen CRM AI Agent Service",
    description="Enterprise AI Agent Microservice cho Zen CRM — Tích hợp Google Gemini Function Calling & Autonomous Actions",
    version="2.0.0"
)

# Cấu hình CORS để Frontend React (Vite 8080/5173) gọi trực tiếp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các endpoints
app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)

