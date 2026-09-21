import { useState } from "react";
import TodoItem from "./TodoItem";
import "./TodoList.css";

//목록을 보여줌,검색기능
const TodoList =({list,onDelete,onToggle}) =>{
  const [search, setSearch]=useState("");

  //검색창에 글자를 칠때마다 그글자를기억
  const  onchangeSearch =(e) => {
    setSearch(e.target.value);
  };

  const getSearchResult =() =>{
    return search === ""
    ? list :list.filter((it) => it.content.toLowerCase().includes(search.toLowerCase())
    );
  };


    return(
     <div className="TodoList">
      <h4>Todo List 🌱</h4>
      <input className="searchbar"
       placeholder="검색어를 입력하세요" 
        value={search}
        onChange={onchangeSearch}
       />
      <div className="list_wrapper">
        {getSearchResult().map((it)=>(<TodoItem key ={it.id} {...it} onDelete={onDelete} onToggle={onToggle}/>
        ))}
      </div>
    </div>
    );
 };

export default TodoList;