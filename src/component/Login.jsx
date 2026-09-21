import { useState } from "react";
import { supabase } from "../supabaseClient";




const Login =({onLogin})=>{
    const [email,setEmail] =useState("");
    const [password,setPassword] =useState("");


    //서버에서 무언가 물어봐 답을 받아와야할때
    //async-시간이 걸리는일이있어 미리표시 기능(이함수는 기다려야한다표시)
    //await-서버응답이 올때까지 여기서 멈춰서 기다리는 기능 
    //이메일과 비밀번호를 입력해서 가입했을때 서버로 보내서 회원가입승인여부판단
    const onSignup =async ()=> {
        const {data,error} = await supabase.auth.signUp({
           email,
           password,     
        });

        if(error){
            alert("가입실패 :"+error.message);
        }else{
            alert("성공티비!로그인고고!");
        }
    };

    const onLoginSubmit = async () => {
        const{data,error}= await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if(error) {
            alert("실패티비:"+error.message);
        }else{
            onLogin(data.user);
        }
    }

    return(
      <div className="Login">
        <h2>로그인 / 회원가입</h2>

        <input
        placeholder="이메일"
        value={email}
        // 이메일을 입력하면 e 데이터로 값을 받은다음 그값을 e.target.value 값으로 추출해서 setEmail값으로 받아서
        // const [email,setEmail] =useState(""); 여기로 넘김
        onChange = {(e) =>setEmail(e.target.value)}
        />
        
        <input
        type="password"
        placeholder="비밀번호(6자이상)"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        />

        <button onClick={onLoginSubmit}>로그인</button>
        <button onClick={onSignup}>회원가입</button>
      </div>
        
    );

};

export default Login;

