import "./TodoItem.css";
//화면에 리스트 뿌려줌
const TodoItem=({id,content,isDone,createdDate,onDelete}) =>{
    return(
        <div className="TodoItem">
           
            <div className="checkbox_col"> 
            <input type="checkbox" checked={isDone} readOnly />
            </div>
              <div className="title_col">{content}</div>
             <div className="date_col">{new Date(createdDate).toLocaleDateString()}</div>
            <div className="btn_col"> 
                 {/* 화면을 읽을때마다 삭제기능이 실행되기때문에
                  ()=> onDelete(id) 이렇게씀으로써 클릭했을때만 실행되게 함*/}
                <button onClick={()=> onDelete(id)}>삭제</button>
            </div>
        </div>
    );
};

export default TodoItem;