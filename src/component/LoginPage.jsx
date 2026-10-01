import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";


const LoginPage=({onLogin})=>{
    const [email,setEmail] = useState("");
    const [password,setPassword] =useState("");
    
    const onLoginSubmit = async () =>{
        const {data,error} =await supabase.auth.signInWithPassword({email,password})
        if(error){
            alert("실패 : " +error.message);
        }else{
            onLogin(data.user);
        }
    };


    // ★ 추가: 엔터 키 감지
    const onKeyDown = (e) => {
        if (e.keyCode === 13) {
        onLoginSubmit();
        }
    };

        return (
            <div className="Login">
            <h2>로그인</h2>

            <input 
            placeholder="이메일"
             value={email} 
             onChange={(e) => setEmail(e.target.value)} 
             onKeyDown={onKeyDown}    
            />

            <input 
            type="password" 
            placeholder="비밀번호" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            onKeyDown={onKeyDown}        
            />

            <button onClick={onLoginSubmit}>로그인</button>
            <p>계정이 없으신가요? <Link to="/signup">회원가입</Link></p>
            </div>
        );

};

export default LoginPage;