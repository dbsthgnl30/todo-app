import json
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends
from pydantic import BaseModel


from backend.core import client,check_login

router = APIRouter()

ASK_RULES = """다음 할일 텍스트를 분석해서 JSON 배열로만 답해. 다른 설명은 붙이지 마.

할일이 여러 개면 각각 나눠서 배열에 넣어. 할일이 하나여도 배열로 답해.

각 할일의 규칙:
- content: 날짜/시간 표현을 뺀 진짜 할일 내용만
- due_date: "YYYY-MM-DD" 형식. 날짜 언급이 없으면 null. 시간만 있고 날짜가 없으면 오늘 날짜
- due_time: "HH:MM" 24시간 형식. 시간 언급이 없으면 null. 오전/오후 표시가 없으면 자연스러운 쪽으로 판단 (예: 병원 3시는 15:00)
- priority: 아래 기준으로 판단
  - 긴급: 오늘/내일처럼 날짜가 임박했거나 "예약", "마감" 같은 표현이 있음
  - 보통: 이번 주 안에 하면 되는 일
  - 낮음: 날짜 언급 없고 집안일/취미처럼 미뤄도 되는 일

형식: [{"content": "...", "due_date": "YYYY-MM-DD" 또는 null, "due_time": "HH:MM" 또는 null, "priority": "긴급" 또는 "보통" 또는 "낮음"}]
"""

ALLOWED_PRIORITY = ["긴급", "보통", "낮음"]


# Claude 답을 검사해서, 이상하면 고치거나 기본값으로 바꾸는 함수
def parse_todos(text, content):
    fallback = [{"content": content, "due_date": None, "due_time": None, "priority": "보통"}]

    try:
        start = text.find("[")
        end = text.rfind("]")
        if start == -1 or end == -1:
            return fallback
        todos = json.loads(text[start:end + 1])
    except Exception as error:
        print("AI 결과 읽기 실패:", error)
        return fallback

    result = []
    for t in todos:
        if not isinstance(t, dict) or not t.get("content"):
            continue
        priority = t.get("priority")
        if priority not in ALLOWED_PRIORITY:
            priority = "보통"
        result.append({
            "content": t["content"],
            "due_date": t.get("due_date"),
            "due_time": t.get("due_time"),
            "priority": priority,
        })

    return result or fallback

class AskAiRequest(BaseModel):
    content: str


@router.post("/ask-ai")
def ask_ai(req: AskAiRequest, user: dict = Depends(check_login)):
    print("로그인한 사람:", user["email"])

    today = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d")
    prompt = ASK_RULES + "\n오늘 날짜: " + today + "\n할일: " + req.content

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text
    except Exception as error:
        print("Claude 호출 실패:", error)
        text = ""

    print("AI 결과:", text)
    return {"todos": parse_todos(text, req.content)}