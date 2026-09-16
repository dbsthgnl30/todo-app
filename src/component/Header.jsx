import "./Header.css";

/*Header 라는 컴포넌트를만들었고*/
const Header =() =>{
    /*화면에 'Header Component'라는 글자가 든 div 박스 하나가 나타난다
     return <div className="Header">Header Component!!!</div>*/

      return (

        <div className="Header">
        <h3>오늘은 📅</h3> 
        <h1>{new Date().toDateString()}</h1> 
        </div>
    );

};

/*Header를 다른파일에서도 사용할수있게 내보냄 */
export default Header;