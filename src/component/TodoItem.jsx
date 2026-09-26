import { useState } from "react";
import "./TodoItem.css";
//할일하나하나,체크박스,삭제버튼
const TodoItem=({id,content,createdDate,onDelete,onToggle,isDone,priority}) =>{

  
     return(
        <div className="TodoItem">     
            <div className="checkbox_col"> 
            <input type="checkbox" 
            checked={isDone}
            //체크박스가 false->true
            //체크박스가 true->false
            onChange={()=> onToggle(id)}
            />
            </div>
              <div className="title_col" title={content}>{content}</div>
              {priority && <span className={`priority_badge priority_${priority}`}>{priority}</span>}
             <div className="date_col">
                {new Date(createdDate).toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "long",
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