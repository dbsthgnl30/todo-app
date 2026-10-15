from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter,Depends
from pydantic import BaseModel

from backend.core import client, check_login, Todo

router = APIRouter()

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


class HandoverRequest(BaseModel):
    todos: list[Todo]


@router.post("/ask-handover")
def handover(req: HandoverRequest, user: dict = Depends(check_login)):
    today = datetime.now(ZoneInfo("Asia/Seoul")).strftime("%Y-%m-%d")

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