import "./App.css";
/*Header 컴포넌트를 App의 자식으로 배치. 즉 Header */
import Header from "./component/Header";
import TodoEditor from "./component/TodoEditor";
import LoginPage from "./component/LoginPage";
import SignUpPage from "./component/SignUpPage";
import TodoList from "./component/TodoList";
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { askAI ,askHandover} from "./aiHelper"; 
import { BrowserRouter, Routes, Route } from "react-router-dom";


function App() {

//useState-화면에 직접보여줘야하는값으로 ,값이 바뀌면 화면을다시그린다(화면에 보이는 리스트개수)
//useRef-리스트가 추가될때마다 기억되야 하는값으로,값이 바껴도 화면을다시그리진않는다(내가추가한리스트개수)

//로그인 정보를 받을 빈상자
const[user,setUser] =useState(null);


const [list, setList] = useState([]);

const [loading, setLoading] = useState(false);

const [memo, setMemo] = useState(false);// 만들어진 인수인계 메모

const [handoverLoading, setHandoverLoading] = useState(false);// 메모 작성 중인지




  //배열
  //{ id: 0, content: "React 공부하기" },
  //{ id: 1, content: "빨래 널기" }
  //글자
  //[{"id":0,"content":"React 공부하기"},{"id":1,"content":"빨래 널기"}]

  //(list저장용)list가 변경될때마다 자동호출


  //새로고침 시 저장된 세션이 있는지 읽어서 usser에 넣어줌
  // useEffect(() =>{
  //   supabase.auth.getSession().then(({data : {session}}) =>{
  //     if(session){
  //       setUser(session.user);
  //     }
    
  //     });
    
  //   },[]);

    //로그인,로그아웃,토근갱신 시 user업데이트
    useEffect(() =>{
      //auth-로그인에 관한 기능 모아놓음
      //on+auth+state+change -로그인상태가 바뀔 때
      const{data : authListener} = supabase.auth.onAuthStateChange(
      
        (event, session) => {
          setUser(session?.user ?? null);
        }
      );
        return() =>{
          authListener.subscription.unsubscribe();
        }
    },[]);



  useEffect(() =>{

    if(!user) return;

    const fetchTodos = async () => { // ① 함수를 "정의"만 함 (아직 실행 안 됨)
      const {data,error} = await supabase
      .from ('todos')                         //todo테이블에서
      .select('*')                            //모든컬럼을 가져오는데
      .eq('user_id',user.id)                  //user_id가 사용자 id랑 같은거만
      .order('created_at',{ascending: false}); //최신순으로 정렬(내림차순)


      if(error){
        console.log("할일불러오기 실패 :",error);
      }else{
          console.log("불러온 데이터:", data);
        setList(data);
      }
    };

    fetchTodos();  // ② 이제 그 함수를 "실행"함
  },[user]);//user가 바뀔때마다 (로그인할 때마다) 다시불러옴
  




    //일정 시간 활동 없으면 자동 로그아웃 (Idle Timeout)
    useEffect(()=>{
    
    let timer;

       const resetTimer=() =>{
        clearTimeout(timer);
        timer =setTimeout(()=> {
          supabase.auth.signOut();
          setUser(null);
          alert("장시간 활동이 없어 로그아웃되었습니다.");
        },30*60*1000); 
       };

      // 마우스 움직임, 키보드 입력 등이 있으면 타이머 리셋
      window.addEventListener("mousemove",resetTimer);
      window.addEventListener("keydown",resetTimer);
      resetTimer();
    
    
      return()=>{
        clearTimeout(timer);
        window.removeEventListener("mousemove",resetTimer);
        window.removeEventListener("keydown",resetTimer);
      };
    },[]);
    


//로그인 정보를 받으면 setUser로 받음
const onLogin =(loggedInUser)=>{
  setUser(loggedInUser);
};

const onLogout = async () =>{
          try {
             console.log("🔥🔥🔥 버튼눌림 🔥🔥🔥");
        const result = await supabase.auth.signOut();
         console.log("로그아웃 결과:", result);
          }catch(error){
            console.log("로그아웃 에러:", error);
          }
}


const onCreate =async(content) =>{
  setLoading(true);
  try{
        // AI한테 물어봄
      //  const priority = await askAI(content, import.meta.env.VITE_CLAUDE_API_KEY);
     
    
      //aiHelper.jsx에서 content를 받아옴
      const parsed = await askAI(content);   

        const today= new Date().toDateString();
        //some-조건에 맞는게 하나라도있는지 확인해서 true,false 반환
        //이미 리스트에 있는 기존할일 it 데이터와 새로 추가된 content와 비교
        const isDuplicate =list.some((it) =>
          it.content === parsed.content && new Date(it.created_at).toDateString() === today);
        
        //값이 true 일때만 실행
        if(isDuplicate){
          alert("이미 추가된거지롱~!");
          return;
        }
        console.log("파싱 결과:", parsed);
        const {data,error} = await supabase
        .from('todos')
        
        .insert ({
          //*DB컬럼이름(소문자) : ai가 준 객체 안의 이름(대문자)
          user_id : user.id,
          content :parsed.content,
          due_date : parsed.due_date,
          due_time : parsed.due_time,
          priority : parsed.priority,
          is_done: false,
        })
        .select();//저장 후 결과를 돌려받기 위해 필요

        console.log("이번 data:", data); 
        if(error){
          alert("저장실패 : " + error.message);
          return;
        }
        //여러 번(추가할 때마다, 삭제할 때마다) 호출
        setList([data[0],...list]);
        
    }finally{
      setLoading(false);
    }
}

//list 중에서, id가 일치하지 않는 것들만 남겨서 새 목록을 만들어라
const onDelete =async(id) =>{
  const {error} = await supabase.from('todos').delete().eq('id',id);
  if(error){
     alert("삭제 실패: " + error.message);
     return;
  }
    setList(list.filter((it) => it.id !== id));
};


const onToggle =async(id)=> {
  const target = list.find((it) => it.id ===id);
  const {error} = await supabase
    .from('todos')
    .update({is_done :!target.is_done })
    .eq('id',id);
  
    if(error){
      alert("수정 실패: " + error.message);
    return;
  }

  setList(
    //map-배열안에있는걸 하나씩 다꺼내서,각각원하는걸로 바꾼다음 새 배열로만들어줘
    //1번 id 체크박스를 체크하고싶다 가정하면 리스트 돌면서 1번 id가 맞으면 isdone을 false나 true 로 바꾸고 아니면 맨끝에 it 으로 가서 반환한다
    list.map((it) =>(it.id === id ? { ...it, is_done : !it.is_done } : it))
  );
};


  const onToggleHandover= async(id)=>{
    const target = list.find((it)=>it.id ===id );

    //db 업데이트
    const {error} =await supabase
    .from('todos')
    .update({is_handover : !target.is_handover})
    .eq('id',id);

   if(error){
      alert("수정 실패: " + error.message);
    return;

  }
    //화면 수정 업데이트
    setList(
      list.map((it) => (it.id === id ? { ...it, is_handover: !it.is_handover } : it))
    );

  };


  // 교대 버튼: 전달사항 + 미완료 할일을 모아서 AI한테 메모로 정리시킴
  const onHandover = async () => {
    const targets =list.filter((it) =>it.is_handover || !it.is_done);

    if(targets.length === 0){
      alert("전달할 내용이 없어요.");
    return;
    }

    setHandoverLoading(true);
    try{
      const result = await askHandover(targets);
      if(!result){
        alert("메모생성에 실패했어요.");
        return;
      }
        setMemo(result);
      }finally{
        setHandoverLoading(false);
      }
    };


    // 메모를 클립보드에 복사
    const onCopyMemo = async () => {
      await navigator.clipboard.writeText(memo);
      alert("복사됐어요. 카톡에 붙여넣으세요.");
    };




//로그인정보가없으면 로그인화면으로 리턴
if(!user){
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage onLogin={onLogin} />} />
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
       <Route path="/signup" element={<SignUpPage />} />
        </Routes>
    </BrowserRouter>
  )
}


  return (
    <div className="App">
      <Header user={user} onLogout={onLogout}/>   {/* 1. 맨 위: 헤더 */}
      <TodoEditor onCreate={onCreate} loading ={loading}/>    {/* 2. 할일 입력창 */}
      <div className="APP">  {/* 3. 교대 버튼과 메모 */}
       <button onClick ={onHandover} disabled={handoverLoading}>
          {handoverLoading ? "메모 작성 중..." : "🔄 교대 인수인계"}
      </button>
        {memo && (
          <div>
            <pre className="handover_memo">{memo}</pre>
            <button onClick={onCopyMemo}>복사</button>
          </div>
        )}
      </div>
       <TodoList list={list}  onDelete={onDelete} onToggle={onToggle} onToggleHandover={onToggleHandover} />     {/* 4. 할일 목록 */}
    </div>
  );
}
export default App;