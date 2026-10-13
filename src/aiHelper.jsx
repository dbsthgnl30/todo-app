import { supabase } from "./supabaseClient";
import axios from "axios";


//서버에 요청을 보낼 axios를 하나 만듬
const api = axios.create();


// 요청이 나가기 직전에 매번 회원카드를 자동으로 붙임
api.interceptors.request.use(async(config)=>{
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token){
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});




// 이 함수는 "content"라는 할일 텍스트를 받아서
// Supabase Edge Function(ask-ai)한테 보내고, 분류 결과를 돌려주는 함수예요
export const askAI = async (content) => {
    try{
       const res =await api.post("/api/ask-ai",{content});
        return res.json();
    }catch(error){
      console.log("AI 호출 실패:",error);
      return { content, due_date: null, due_time: null, priority: "보통" };
    }

};

// 할일 목록을 서버(handover)에 보내고, 인수인계 메모를 돌s려받는 함수
export const askHandover = async(todos)=>{
  
  try{
       const res =await api.post("/api/ask-handover",{todos});
       return res.data.memo;
    }catch(error){
      console.log("인수인계 메모 실패:", error);
      return null;
    }
  };