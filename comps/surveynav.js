//trying to make the navigation for the survey into its own component
import React, {useState, useEffect} from 'react';

//local imports 
import NavButton from './buttons/navbutton'
import styles from '../styles/navbar.module.css'

const SurveyNav = (props) => {

    const[display, setDisplay] = useState(false)

    const buttonState = [{name:"Governance",state:true},
                         {name:"Design", state:false},
                         {name:"Implementation", state:false},
                         {name:"Verification", state:false},
                         {name:"Operations", state:false},
                         {name:"Details", state:false}]

    for (const key in buttonState) {
           buttonState[key].state = false
           if(buttonState[key].name == props.button){
            buttonState[key].state = true
           }
        }

    function getNavbarState(){
        for (const key in buttonState){
            if(buttonState[key].state){
                return buttonState[key].name;
            }
        }
    }

    // Primitive snapshot (not the array/function references, which are recreated every
    // render) so the effect's dependency comparison is meaningful.
    const currentNavbarState = getNavbarState();

    useEffect(() => {
        var navbarState = sessionStorage.getItem('navbarState');
        // Direct navigation to /assessment (deep link, bookmark, fresh tab) skips
        // the Home page, which is what normally seeds sessionStorage's userState.
        var userState = JSON.parse(sessionStorage.getItem('userState')) || {};
        if (navbarState != currentNavbarState){
            if(!(userState['has_switched_page'])){
                navbarState = currentNavbarState;
                sessionStorage.setItem('navbarState', navbarState);
            }
        }


    },[display, currentNavbarState])
    console.log("this is the button state: " + props.button)

    function updateButtonState(index){
        props.onClick(buttonState[index].name);
        setDisplay(!display);
    }

    return (<>
        <nav className = {styles.pageNav}>
            <NavButton  name ={buttonState[0].name} state={buttonState[0].state}    onClick={()=>updateButtonState(0)}/>
            <NavButton  name ={buttonState[1].name} state={buttonState[1].state}    onClick={()=>updateButtonState(1)}/>
            <NavButton  name ={buttonState[2].name} state={buttonState[2].state}    onClick={()=>updateButtonState(2)}/>
            <NavButton  name ={buttonState[3].name} state={buttonState[3].state}    onClick={()=>updateButtonState(3)} />
            <NavButton  name ={buttonState[4].name} state={buttonState[4].state}    onClick={()=>updateButtonState(4)} /> 
            <NavButton  name ={buttonState[5].name} state={buttonState[5].state}    onClick={()=>updateButtonState(5)} />
        </nav>
        <div className={styles.pageNav}>
            <h2>{props.button}</h2>
        </div>
        </>);
}
 
export default SurveyNav;