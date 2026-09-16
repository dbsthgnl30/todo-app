import { useState, useRef } from "react";
import "./TodoEditor.css";
//화면에 리스트 추가
const TodoEditor =({onCreate}) =>{
   const [content, setContent] = useState("");
   const inputRef = useRef();

   //지금 입력창에 뭐라고 쳐있는지 가져와서(e.target.value), 그걸 저장해라(setContent)
   const onChangeContent=(e) => {
      setContent(e.target.value);
   };
   
   const onSubmit = ()=>{
      //입력창에 아무값도없으먄 커서를 띄워
      if(!content){
         inputRef.current.focus();
         return;
      }
      //값이있다면 입력한 내용을 onCreate 함수한테 넘겨줌
      onCreate(content);
      //추가하고난뒤 다시 빈칸으로 만듬
      setContent("");
   }
   //엔터치면 실행해
   const onKeyDown =(e) =>{
      if(e.keyCode ===13){
         onSubmit();
      }
   }


   return (
      <div className="TodoEditor">
         <h4>새로운 Todo 작성하기 ✏️ </h4>
         <div className="editor_wrapper">
            <input 
            ref={inputRef}
            value ={content}
            onChange={onChangeContent}
            onKeyDown={onKeyDown}
            placeholder="새로운 Todo..."
            />
            <button onClick={onSubmit}>추가</button>
         </div>
      </div>
   );
  
};
export default TodoEditor;