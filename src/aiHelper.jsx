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
    //배열->문자열 
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens:  200,  
     messages: [
        {
          role: "user",
          content: `다음 할일 텍스트를 분석해서 JSON으로만 답해. 다른 설명은 붙이지 마.

오늘 날짜: ${new Date().toLocaleDateString("sv-SE")}

규칙:
- content: 날짜/시간 표현을 뺀 진짜 할일 내용만
- dueDate: "YYYY-MM-DD" 형식. 날짜 언급이 없으면 null
- priority: 아래 기준으로 판단
  - 긴급: 오늘/내일처럼 날짜가 임박했거나 "예약", "마감" 같은 표현이 있음
  - 보통: 이번 주 안에 하면 되는 일
  - 낮음: 날짜 언급 없고 집안일/취미처럼 미뤄도 되는 일

형식: {"content": "...", "dueDate": "YYYY-MM-DD" 또는 null, "priority": "긴급" 또는 "보통" 또는 "낮음"}

할일: "${content}"`
        }
      ]
    })
  });

  const data = await response.json();//글자를 객체로 바꿔서 넣어주는데
  const rawText = data.content[0].text;//객체중에 text만 뽑아내서 

  // AI가 가끔 ```json 표시를 붙여서 답하면 지워줌
  const cleanedText = rawText.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(cleanedText);   // 글자 → 객체로 변환
  } catch (error) {
    console.log("AI 응답 파싱 실패:", rawText);
    return { content, dueDate: null, priority: "보통" };   // 실패하면 기본값
  }
};