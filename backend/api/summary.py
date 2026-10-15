from fastapi import APIRouter, Depends
from pydantic import BaseModel

from backend.core import client, check_login, Todo

router = APIRouter()

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


@router.post("/weekly-summary")
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