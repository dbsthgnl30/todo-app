import { supabase } from "./supabaseClient";

// 이 함수는 "content"라는 할일 텍스트를 받아서
// Supabase Edge Function(ask-ai)한테 보내고, 분류 결과를 돌려주는 함수예요
export const askAI = async (content) => {
  // 서버에 있는 ask-ai 함수를 부름 (Claude 호출은 서버가 대신 해줌)
  const { data, error } = await supabase.functions.invoke("ask-ai", {
    body: { content },
  });

  // 실패하면 기본값
  if (error) {
    console.log("AI 호출 실패:", error);
    return { content, due_date: null, due_time: null, priority: "보통" };
  }

  return data;
};