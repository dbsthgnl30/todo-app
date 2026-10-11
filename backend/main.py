
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

RULES = """다음 할일 텍스트를 분석해서 JSON으로만 답해. 다른 설명은 붙이지 마.

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
    prompt = RULES + "\n오늘 날짜: " + today + "\n할일: " + req.content

    message = client.messages.create(
    model="claude-sonnet-4-6",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )

    text = message.content[0].text
    text = text.replace("```json", "").replace("```", "").strip()
    return json.loads(text)
