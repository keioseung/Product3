from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

from .api import ai_info, quiz, prompt, base_content, term, auth, logs, system

app = FastAPI()

# CORS 설정 - Railway 배포 환경에 맞게 조정 (임시로 관대한 설정)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 임시로 모든 origin 허용
    allow_credentials=True,
    allow_methods=["*"],  # 모든 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
    expose_headers=["*"],
)

# 헬스체크 엔드포인트
@app.get("/")
async def root():
    return {"message": "AI Mastery Hub Backend is running", "status": "healthy", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    try:
        from .database import engine
        # 데이터베이스 연결 테스트
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
        return {"status": "healthy", "database": "connected", "timestamp": "2024-01-01T00:00:00Z"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e), "timestamp": "2024-01-01T00:00:00Z"}

@app.options("/{path:path}")
async def options_handler(path: str):
    """OPTIONS 요청을 명시적으로 처리"""
    return {"message": "OK"}

# 전역 예외 처리기
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc), "path": str(request.url)}
    )

# 404 처리기
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"error": "Not found", "path": str(request.url)}
    )

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(logs.router, prefix="/api/logs", tags=["Activity Logs"])
app.include_router(system.router, prefix="/api/system", tags=["System Management"])
app.include_router(ai_info.router, prefix="/api/ai-info")
app.include_router(quiz.router, prefix="/api/quiz")
app.include_router(prompt.router, prefix="/api/prompt")
app.include_router(base_content.router, prefix="/api/base-content")
app.include_router(term.router, prefix="/api/term") 