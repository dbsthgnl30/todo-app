
import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import FastAPI
from pydantic import BaseModel  
from dotenv import load_dotenv  
from anthropic import Anthropic 

#.env 파일을 읽어 옵니다.
load_dotenv("backend/.env")     
#읽어온 것 중에 키를 꺼내서 그 키로 claude와 통신할 준비를 함                            
client = Anthropic(api_key=os.environ.get("CLAUDE_API_KEY")) 

app =FastAPI()

ASK_RULES = """다음 할일 텍스트를 분석해서 JSON으로만 답해. 다른 설명은 붙이지 마.

규칙:
- content: 날짜/시간 표현을 뺀 진짜 할일 내용만
- due_date: "YYYY-MM-DD" 형식. 날짜 언급이 없으면 null. 시간만 있고 날짜가 없으면 오늘 날짜
- due_time: "HH:MM" 24시간 형식. 시간 언급이 없으면 null. 오전/오후 표시가 없으면 자연스러운 쪽으로 판단 (예: 병원 3시는 15:00)
- priority: 아래 기준으로 판단
  - 긴급: 오늘/내일처럼 날짜가 임박했거나 "예약", "마감" 같은 표현이 있음
  - 보통: 이번 주 안에 하면 되는 일
  - 낮음: 날짜 언급 없고 집안일/취미처럼 미뤄도 되는 일

형식: {"content": "...", "due_date": "YYYY-MM-DD" 또는 null, "due_time": "HH:MM" 또는 null, "priority": "긴급" 또는 "보통" 또는 "낮음"}
"""





@app.get("/health")
def health() :
    return{"status":"ok"}



#프론트애서 보낸 content값을 AskAiRequest가 받음
class AskAiRequest(BaseModel):
    content: str

#api/ask-ai 주소로 POST 요청이 오면, 
# 그 req를 토대로 return 값을 돌려준다.
@app.post("/api/ask-ai")
def ask_ai(req:AskAiRequest):

    today = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d")
    prompt = ASK_RULES + "\n오늘 날짜: " + today + "\n할일: " + req.content

    message = client.messages.create(
    model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)



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
def handover(req : HandoverRequest):
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
