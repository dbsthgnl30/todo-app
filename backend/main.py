from fastapi import FastAPI

from backend.api.ask_ai import router as ask_ai_router
from backend.api.handover import router as handover_router
from backend.api.summary import router as summary_router

app = FastAPI()


@app.get("/health")
def health():
    return {"status": "ok"}


# 다른 파일에 만든 API들을 서버에 등록
app.include_router(ask_ai_router, prefix="/api")
app.include_router(handover_router, prefix="/api")
app.include_router(summary_router, prefix="/api")