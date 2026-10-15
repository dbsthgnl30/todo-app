import os
import httpx
from fastapi import Header, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from anthropic import Anthropic


load_dotenv("backend/.env")

client = Anthropic(api_key=os.environ.get("CLAUDE_API_KEY"))
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")




# 회원카드(토큰)가 진짜인지 Supabase에 물어보는 함수
def check_login(authorization: str | None = Header(default=None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    res = httpx.get(
        SUPABASE_URL + "/auth/v1/user",
        headers={"apikey": SUPABASE_ANON_KEY, "Authorization": authorization},
    )

    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    return res.json()


# 할일 하나의 모양 (인수인계, 주간 요약에서 같이 씀)
class Todo(BaseModel):
    content: str
    is_handover: bool | None = False
    is_done: bool | None = False
    priority: str | None = None
    due_date: str | None = None
    due_time: str | None = None
