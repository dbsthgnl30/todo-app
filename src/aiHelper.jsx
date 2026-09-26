// 이 함수는 "content"라는 할일 텍스트를 받아서
// AI한테 물어보고, 우선순위 답을 돌려주는 함수예요
export const askAI = async (content) => {

  // Claude API한테 보낼 요청을 만듦
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true" 
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: `다음 할일의 우선순위를 정해줘.
                    기준:
                    - 긴급: 오늘/내일처럼 날짜가 임박했거나 "예약", "마감" 같은 표현이 있음
                    - 보통: 이번 주 안에 하면 되는 일
                    - 낮음: 날짜 언급 없고 집안일/취미처럼 미뤄도 되는 일

                    "긴급", "보통", "낮음" 중 하나만 답해. 다른 말은 하지마.
                    할일: "${content}"`
        }
      ]
    })
  });

  // AI가 보낸 답을 꺼냄
  const data = await response.json();
  const priority = data.content[0].text.trim();

  return priority;
};