import { useState } from "react";
import "./TodoItem.css";
//할일하나하나,체크박스,삭제버튼
const TodoItem=({id,content,created_at,onDelete,onToggle,is_done,priority,due_date,due_time}) =>{

  
     return(
        <div className="TodoItem">     
            <div className="checkbox_col"> 
            <input type="checkbox" 
            checked={is_done}
            //체크박스가 false->true
            //체크박스가 true->false
            onChange={()=> onToggle(id)}
            />
            </div>
              <div className="title_col" title={content}>
                 <div className="title_text">{content}</div>
               {(due_date || due_time) && (
                <div className="due_text">
                📅 {due_date} {due_time ? due_time.slice(0, 5) : ""}
                </div>
             )}
             </div>
               {priority && <span className={`priority_badge priority_${priority}`}>{priority}</span>}
             <div className="date_col">
                {new Date(created_at).toLocaleString("ko-KR", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
})}
             </div>
            <div className="btn_col"> 
                 {/* 화면을 읽을때마다 삭제기능이 실행되기때문에
                  ()=> onDelete(id) 이렇게씀으로써 클릭했을때만 실행되게 함*/}
                <button onClick={()=> onDelete(id)}>삭제</button>
            </div>
        </div>
    );
};

export default TodoItem;