import "./App.css";
/*Header 컴포넌트를 App의 자식으로 배치. 즉 Header */
import Header from "./component/Header";
import TodoEditor from "./component/TodoEditor";
import TodoList from "./component/TodoList";
import { useState, useRef,useEffect } from "react";

const mockTodo = [ 
  {
    id: 0,
    isDone: false,
    content: "React 공부하기",
    createdDate: new Date().getTime(),
  },
  {
    id: 1,
    isDone: false,
    content: "빨래 널기",
    createdDate: new Date().getTime(),
  },
];

function App() {

//useState-화면에 직접보여줘야하는값으로 ,값이 바뀌면 화면을다시그린다(화면에 보이는 리스트개수)
//useRef-리스트가 추가될때마다 기억되야 하는값으로,값이 바껴도 화면을다시그리진않는다(내가추가한리스트개수)


//초깃값이 2인 Ref객체를 생성해 idRef에 저장
const idRef = useRef(2);

//[현재값,값을 바꾸는 함수] /useState(mockTodo)-처음한번만 실행됨*/
const [list, setList] = useState(() => {
  //데이터를 저장할땐 배열->문자열 (JSON.stringify)
  //데이터를 꺼내올땐 문자열->배열 (JSON.parse)
  //localStorage에서 저장된todelist 꺼내옴(문자열 상태)
  const savedList =localStorage.getItem("todoList");
  //savedList가 존재하면 → savedList를 문자열에서 배열로 변환해서 리턴하고, 존재하지 않으면 → mockTodo를 리턴
  return  savedList ? JSON.parse(savedList) : mockTodo;
});

useEffect(() =>{
  //배열
  //{ id: 0, content: "React 공부하기" },
  //{ id: 1, content: "빨래 널기" }
  //글자
  //[{"id":0,"content":"React 공부하기"},{"id":1,"content":"빨래 널기"}]
  
  //[list]가 바뀔때마다(추가,삭제) 그배열을 문자자열로 바꿔서[JSON.stringify(list)] todoList라는 이름으로 localStorage애 저장해
  localStorage.setItem("todoList",JSON.stringify(list));},[list]);

const onCreate =(content) =>{
  const newItem ={
    id : idRef.current,
    content,
    isDone : false,
    createdDate : new Date().getTime(),
  
  };
  setList([newItem,...list]);
  //idRef를 이용해 아이템 생성마다 id가 1씩 늘어나도록 수정
  idRef.current +=1;
}

//list 중에서, id가 일치하지 않는 것들만 남겨서 새 목록을 만들어라
const onDelete =(id) =>{
  setList(list.filter((it) => it.id !==id));
};


const onToggle =(id)=> {
  setList(
    //map-배열안에있는걸 하나씩 다꺼내서,각각원하는걸로 바꾼다음 새 배열로만들어줘
    //1번 id 체크박스를 체크하고싶다 가정하면 리스트 돌면서 1번 id가 맞으면 isdone을 false나 true 로 바꾸고 아니면 맨끝에 it 으로 가서 반환한다
    list.map((it) =>(it.id === id ? { ...it, isDone : !it.isDone } : it))
  );
};


  return (
    <div className="App">
      <Header/>
      <TodoEditor onCreate={onCreate}/>
       {/*리스트를뿌려줌*/}
       <TodoList list={list}  onDelete={onDelete} onToggle={onToggle}/> 
    </div>
  );
}
export default App;