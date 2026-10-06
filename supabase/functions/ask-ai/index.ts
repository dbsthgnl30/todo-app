// supabase/functions/ask-ai/index.ts
// 할일 텍스트를 받아서 Claude한테 물어보고, 분류 결과를 돌려주는 서버 함수

// 브라우저에서 이 함수를 부를 수 있게 허용하는 설정 (CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 결과를 JSON 응답으로 포장해주는 도우미
const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  // 브라우저가 본 요청 전에 보내는 "사전 확인" 요청 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 프론트가 보낸 할일 텍스트 받기
  const { content } = await req.json();

  // 뭔가 실패했을 때 돌려줄 기본값
  const fallback = { content, due_date: null, due_time: null, priority: "보통" };

  try {
    // 서버는 한국 시간이 아니라서, 한국 기준 오늘 날짜를 직접 지정
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 키는 코드에 없고, Supabase 비밀 저장소에서 꺼내옴
        "x-api-key": Deno.env.get("CLAUDE_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `다음 할일 텍스트를 분석해서 JSON으로만 답해. 다른 설명은 붙이지 마.

오늘 날짜: ${today}

규칙:
- content: 날짜/시간 표현을 뺀 진짜 할일 내용만
- due_date: "YYYY-MM-DD" 형식. 날짜 언급이 없으면 null. 시간만 있고 날짜가 없으면 오늘 날짜
- due_time: "HH:MM" 24시간 형식. 시간 언급이 없으면 null. 오전/오후 표시가 없으면 자연스러운 쪽으로 판단 (예: 병원 3시는 15:00)
- priority: 아래 기준으로 판단
  - 긴급: 오늘/내일처럼 날짜가 임박했거나 "예약", "마감" 같은 표현이 있음
  - 보통: 이번 주 안에 하면 되는 일
  - 낮음: 날짜 언급 없고 집안일/취미처럼 미뤄도 되는 일

형식: {"content": "...", "due_date": "YYYY-MM-DD" 또는 null, "due_time": "HH:MM" 또는 null, "priority": "긴급" 또는 "보통" 또는 "낮음"}

할일: "${content}"`,
          },
        ],
      }),
    });

    // Claude API가 실패하면 (키 오류, 한도 초과 등) 기본값으로 응답
    if (!response.ok) {
      console.log("Claude API 오류:", response.status, await response.text());
      return json(fallback);
    }

    const data = await response.json();
    const rawText = data.content[0].text;

    // AI가 가끔 ```json 표시를 붙여서 답하면 지워줌
    const cleanedText = rawText.replace(/```json|```/g, "").trim();

    return json(JSON.parse(cleanedText));
  } catch (error) {
    console.log("AI 처리 실패:", error);
    return json(fallback);
  }
});