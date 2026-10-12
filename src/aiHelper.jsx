// 이 함수는 "content"라는 할일 텍스트를 받아서
// Supabase Edge Function(ask-ai)한테 보내고, 분류 결과를 돌려주는 함수예요
export const askAI = async (content) => {

    try{
       const res =await fetch("/api/ask-ai",{
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
       });
       return await res.json();
    }catch(error){
      console.log("AI 호출 실패:",error);
      return { content, due_date: null, due_time: null, priority: "보통" };
    }

};

// 할일 목록을 서버(handover)에 보내고, 인수인계 메모를 돌s려받는 함수
export const askHandover = async(todos)=>{
  
  try{
       const res =await fetch("/api/ask-handover",{
        method : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todos }),
       });
       const data = await res.json();
       return data.memo;
    }catch(error){
      console.log("인수인계 메모 실패:", error);
      return null;
    }
  };