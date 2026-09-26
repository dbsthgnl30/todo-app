import { useState } from "react";
import TodoItem from "./TodoItem";
import "./TodoList.css";

//한페이지당 보여줄 개수
const ITEM_PER_PAGE=5;

//목록을 보여줌,검색기능,페이징기능
const TodoList =({list,onDelete,onToggle}) =>{
  const [search, setSearch]=useState("");
  const [page,setPage]=useState(1);//

  //검색창에 글자를 칠때마다 그글자를기억
  const  onchangeSearch =(e) => {
    setSearch(e.target.value);
    setPage(1);//검색어가 바뀌면 1페이지로 초기화
  };

  //검색어가 포함된 항목만 걸러냄
  const getSearchResult =() =>{
    return search === ""
    ? list :list.filter((it) => it.content.toLowerCase().includes(search.toLowerCase())
    );
  };


  const searchResult = getSearchResult();

  //전체 페이지 수 계산 
  const totalPages= Math.ceil(searchResult.length/ITEM_PER_PAGE);


  //각페이지당 시작인덱스가 몇인지 계산
  const startIndex = (page-1) * ITEM_PER_PAGE;
  
  //한페이지당 보여지는개수를 자름
  const pagedResult = searchResult.slice(startIndex, startIndex + ITEM_PER_PAGE);


    return(
     <div className="TodoList">
      <h4>Todo List 🌱</h4>
      <input className="searchbar"
       placeholder="검색어를 입력하세요" 
        value={search}
        onChange={onchangeSearch}
       />
      <div className="list_wrapper">
        {pagedResult.map((it)=>(<TodoItem key ={it.id} {...it} onDelete={onDelete} onToggle={onToggle}/>
        ))}
      </div>

      <div className="pagination">
        <button
        //현재 1페이지라면 비활성화버튼 생성
        disabled ={page ===1}
        //아니라면 이전페이지 이동
        onClick={() => setPage(page - 1)}
        >
        이전
        </button>
        {/* 현재페이지수// 전체페이지수 or 페이지수가없으면 '1'  */}
        <span>{page}/{totalPages || 1 }</span>
        <button
        //마지막페이지 or 페이지가 업으면 0
        disabled = {page === totalPages || totalPages === 0}
        //다음페이지 이동
        onClick={() => setPage(page+1)}
        >
          다음
        </button>
      </div>
    </div>
    );
 };

export default TodoList;