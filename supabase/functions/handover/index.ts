// supabase/functions/handover/index.ts
// 할일 목록을 받아서 Claude한테 "인수인계 메모"로 정리해달라고 하는 서버 함수
 
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
 
// 프론트가 보내주는 할일 하나의 모양
type Todo = {
  content: string;
  is_handover: boolean;
  is_done: boolean;
  priority: string | null;
  due_date: string | null;
  due_time: string | null;
};
 
Deno.serve(async (req) => {
  // 브라우저가 본 요청 전에 보내는 "사전 확인" 요청 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
 
  // 프론트가 보낸 할일 목록 받기
  const { todos }: { todos: Todo[] } = await req.json();
 
  // AI가 실패했을 때 대신 돌려줄 기본 메모 (할일을 한 줄씩 나열)
  const fallbackMemo = todos.map((t) => `- ${t.content}`).join("\n");
 
  try {
    // 서버는 한국 시간이 아니라서, 한국 기준 오늘 날짜를 직접 지정
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });
 
    // 할일 목록(배열)을 Claude가 읽기 좋은 글자로 바꿈
    const todoText = todos
      .map(
        (t, i) =>
          `${i + 1}. ${t.content} | 전달사항: ${t.is_handover ? "예" : "아니오"} | 완료: ${t.is_done ? "예" : "아니오"} | 우선순위: ${t.priority ?? "없음"} | 마감: ${t.due_date ?? "없음"} ${t.due_time ?? ""}`,
      )
      .join("\n");
 
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 키는 ask-ai 때 저장해둔 것을 같이 씀
        "x-api-key": Deno.env.get("CLAUDE_API_KEY") ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `너는 교대 근무 인수인계 메모를 작성하는 도우미야. 아래 할일 목록을 다음 근무자가 바로 이해할 수 있는 인수인계 메모로 정리해.
 
오늘 날짜: ${today}
 
규칙:
- "전달사항: 예"인 항목은 [전달사항] 묶음에, 나머지 항목은 [미완료 업무] 묶음에 정리
- 각 묶음 안에서는 우선순위가 긴급인 것부터 적기
- 마감 날짜나 시간이 있으면 같이 적기
- 해당하는 항목이 없는 묶음은 생략
- 목록에 없는 내용은 절대 지어내지 말 것
- 카카오톡에 붙여넣을 거라 마크다운 기호(#, **)는 쓰지 말고 일반 텍스트로
- 인사말이나 설명 없이 메모만 출력
 
할일 목록:
${todoText}`,
          },
        ],
      }),
    });
 
    // Claude API가 실패하면 (키 오류, 한도 초과 등) 기본 메모로 응답
    if (!response.ok) {
      console.log("Claude API 오류:", response.status, await response.text());
      return json({ memo: fallbackMemo });
    }
 
    const data = await response.json();
    const memo = data.content[0].text.trim();
 
    return json({ memo });
  } catch (error) {
    console.log("인수인계 메모 생성 실패:", error);
    return json({ memo: fallbackMemo });
  }
});