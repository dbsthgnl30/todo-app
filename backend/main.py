
import os
import json
import httpx
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import FastAPI,Header, HTTPException, Depends
from pydantic import BaseModel  
from dotenv import load_dotenv  
from anthropic import Anthropic 

#.env 파일을 읽어 옵니다.
load_dotenv("backend/.env")     
#읽어온 것 중에 키를 꺼내서 그 키로 claude와 통신할 준비를 함                            
client = Anthropic(api_key=os.environ.get("CLAUDE_API_KEY")) 
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY")


# 회원카드(토큰)가 진짜인지 Supabase에 물어보는 함수
def check_login(authorization: str | None = Header(default=None)):
    # 카드가 아예 없으면 거절
    if not authorization:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    # Supabase에 "이 카드 주인이 누구야?" 하고 물어봄
    res = httpx.get(
        SUPABASE_URL + "/auth/v1/user",
        headers={"apikey": SUPABASE_ANON_KEY, "Authorization": authorization},
    )

    # Supabase가 모른다고 하면 거절
    if res.status_code != 200:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다")

    # 진짜면 그 사람 정보를 돌려줌
    return res.json()



app =FastAPI()

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





@app.get("/health")
def health() :
    return{"status":"ok"}


ALLOWED_PRIORITY = ["긴급", "보통", "낮음"]


# Claude 답을 검사해서, 이상하면 고치거나 기본값으로 바꾸는 함수
def parse_todos(text, content):
    fallback = [{"content": content, "due_date": None, "due_time": None, "priority": "보통"}]

    # 1. [ 부터 ] 까지만 잘라서 읽기
    try:
        start = text.find("[")
        end = text.rfind("]")
        if start == -1 or end == -1:
            return fallback
        todos = json.loads(text[start:end + 1])
    except Exception as error:
        print("AI 결과 읽기 실패:", error)
        return fallback

    # 2. 할일 하나씩 검사
    result = []
    for t in todos:
        if not isinstance(t, dict) or not t.get("content"):
            continue  # 모양이 이상하거나 내용이 없으면 버림
        priority = t.get("priority")
        if priority not in ALLOWED_PRIORITY:
            priority = "보통"  # 정해진 값이 아니면 보통으로
        result.append({
            "content": t["content"],
            "due_date": t.get("due_date"),
            "due_time": t.get("due_time"),
            "priority": priority,
        })

    # 3. 남은 게 하나도 없으면 기본값
    return result or fallback



#프론트애서 보낸 content값을 AskAiRequest가 받음
class AskAiRequest(BaseModel):
    content: str

#api/ask-ai 주소로 POST 요청이 오면, 
# 그 req를 토대로 return 값을 돌려준다.
@app.post("/api/ask-ai")
def ask_ai(req:AskAiRequest,  user: dict = Depends(check_login)):

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
    

HANDOVER_RULES = """너는 교대 근무 인수인계 메모를 작성하는 도우미야. 아래 할일 목록을 다음 근무자가 바로 이해할 수 있는 인수인계 메모로 정리해.

규칙:
- "전달사항: 예"인 항목은 [전달사항] 묶음에, 나머지 항목은 [미완료 업무] 묶음에 정리
- 각 묶음 안에서는 우선순위가 긴급인 것부터 적기
- 마감 날짜나 시간이 있으면 같이 적기
- 해당하는 항목이 없는 묶음은 생략
- 목록에 없는 내용은 절대 지어내지 말 것
- 카카오톡에 붙여넣을 거라 마크다운 기호(#, **)는 쓰지 말고 일반 텍스트로
- 인사말이나 설명 없이 메모만 출력
"""


 #할일 하나의 모양
class Todo(BaseModel):
    content: str
    is_handover: bool | None = False
    is_done: bool | None = False
    priority: str | None = None
    due_date: str | None = None
    due_time: str | None = None


class HandoverRequest(BaseModel):
        todos: list[Todo]

@app.post("/api/ask-handover")
def handover(req : HandoverRequest, user: dict = Depends(check_login)):
    today = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d")

     # 할일 목록을 Claude가 읽기 좋은 글자로 바꿈
    todo_text = ""
    number = 1
    for t in req.todos:
        todo_text += (
            str(number) + ". " + t.content
            + " | 전달사항: " + ("예" if t.is_handover else "아니오")
            + " | 완료: " + ("예" if t.is_done else "아니오")
            + " | 우선순위: " + (t.priority or "없음")
            + " | 마감: " + (t.due_date or "없음") + " " + (t.due_time or "")
            + "\n"
        )
        number += 1

    prompt = HANDOVER_RULES + "\n오늘 날짜: " + today + "\n\n할일 목록:\n" + todo_text

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )

    return {"memo": message.content[0].text.strip()}    



SUMMARY_RULES = """너는 할일 관리 도우미야. 아래 최근 7일 할일 목록을 보고 주간 요약을 작성해.

규칙:
- 첫 줄에 "이번 주 N개 중 M개 완료 (비율%)" 형식으로 적기
- [한 일] 묶음에 완료된 할일 적기
- [못 한 일] 묶음에 미완료 할일을 우선순위 긴급인 것부터 적기
- 마지막에 다음 주를 위한 한 줄 조언 적기
- 목록에 없는 내용은 절대 지어내지 말 것
- 마크다운 기호(#, **)는 쓰지 말고 일반 텍스트로
- 인사말 없이 요약만 출력
"""
class SummaryRequest(BaseModel):
    todos: list[Todo]


@app.post("/api/weekly-summary")
def weekly_summary(req: SummaryRequest, user: dict = Depends(check_login)):
    todo_text = ""
    number = 1
    for t in req.todos:
        todo_text += (
            str(number) + ". " + t.content
            + " | 완료: " + ("예" if t.is_done else "아니오")
            + " | 우선순위: " + (t.priority or "없음")
            + "\n"
        )
        number += 1

    prompt = SUMMARY_RULES + "\n할일 목록:\n" + todo_text

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=600,
        messages=[{"role": "user", "content": prompt}],
    )

    return {"summary": message.content[0].text.strip()}




