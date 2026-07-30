//All the survey logic in this page 

//TODO: make the panels buttons part of an outside function

import React, {useState, useEffect, useLayoutEffect, useRef, useCallback} from 'react';
// Idiomatic package-subpath import resolves fine as of Next 16 / survey-core 2.5.x.
import 'survey-core/survey-core.css';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
//local imports
import Json from  '../surveys/totalsurvey';
import InputFile from '../inputfile';
import SurveyNav from '../surveynav';
import DropButton from '../buttons/dropdownbutton';
import SurveyButton from '../buttons/surveybuttons';
import {useRouter} from 'next/router'
import question_desc from '../surveys/question_desc';

// import saveText from '../saveResponses';


const survey = new Model(Json());

function formatDate(date) {
    let month = ''+(date.getMonth() + 1),
    day = '' + date.getDate(),
    year = date.getFullYear(),
    hours = '' +date.getHours(),
    minutes = '' +date.getMinutes(),
    seconds = '' +date.getSeconds();
    if  (month.length < 2) {
      month = '0' + month;
    }
    if (day.length < 2) {
      day = '0' + day;
    }
    if (hours.length < 2) {
      hours = '0' + hours;
    }
    if (minutes.length < 2) {
      minutes = '0' + minutes;
    }
    if (seconds.length < 2) {
      seconds = '0' + seconds;
    }
  
    return [year, month, day,hours,minutes,seconds].join('');
  }

// Appends cls to a space-separated class list only if not already present.
// survey-core reuses the same cssClasses object across re-renders, so plain
// `+=` concatenation (the previous approach) grew the class string unbounded.
function addClassOnce(current, cls) {
    var tokens = (current || "").split(" ").filter(Boolean);
    if (tokens.indexOf(cls) === -1) {
        tokens.push(cls);
    }
    return tokens.join(" ");
}

const Mysurvey = (prop) => {
    
    const [surveyState,setSurvey] = useState(survey);
    const router = useRouter();
    const [display, setDisplay] = useState(false);
    const [populateState,setPopulateState] = useState(false);
    const [pageState, setPageState] = useState("Governance"); 
    const [dropDownState, setDropDownState] = useState(false);
    const [isDetailsPage, setDetailsPage] = useState(false);
    const [reloadSurvey, setReloadSurvey] = useState(false);
    // Was a module-level `var` mutated from render/callbacks (react-hooks/globals
    // flags reassigning a variable declared outside the component). A ref keeps the
    // exact same "reassign in place, no re-render" semantics, but scoped to this
    // component instance instead of shared module state across every mount.
    const isDropDownButtonClickedRef = useRef(false);

    // pageState mirror: the effect below only depends on [display], so its
    // closure would otherwise see a stale pageState from whenever it last ran.
    const pageStateRef = useRef(pageState);
    useEffect(() => { pageStateRef.current = pageState; }, [pageState]);

    // Function that changes page and sets the state of buttons on the navbar
    const changePage = useCallback(function changePage(pageName){

        if(pageName != "next"){
            survey.currentPage = pageName
        }
        else{

                if(survey.currentPageNo == 0){
                    pageName = "Design";

                }
                else if(survey.currentPageNo == 1){
                    pageName = "Implementation";
                }
                else if(survey.currentPageNo == 2){
                    pageName = "Verification";

                }
                else if(survey.currentPageNo == 3){
                    pageName = "Operations";

                }
                else if(survey.currentPageNo == 4){


                    pageName = "Details";
                    setDetailsPage(true)

                }else if(survey.currentPageNo == 5){

                    // setSurvey(survey);
                    // setDisplay(!display);
                    pageName = "Details";
                    setDetailsPage(true)
                    router.push('/results');
                    // survey.completeLastPage();

                }else{
                    setDetailsPage(true);
                }
            survey.currentPage = pageName;
        }
        if(pageName == "Details"){
            setDetailsPage(true)
        } else{
            setDetailsPage(false)
        }
        setPageState(pageName);
        var navBarState = sessionStorage.getItem('navbarState');
        navBarState = pageName;
        sessionStorage.setItem('navbarState', navBarState);
        setSurvey(survey);

    }, [router]);

    // isDetailsPage mirrors pageState (changePage's trailing if/else always keeps them
    // in sync -- see the `if(pageName == "Details")` block above), so it must be
    // declared here, before the effect below reads it via isChangedPage, and not as a
    // hoisted `function` declared later in the component body.
    function isChangedPage(userStateData){
        if (userStateData != 'assessmentPage'){
            return true;
        } else {
            return false
        }
    }

    //Use Effect for populating the Survey with predefined answerd from a file or from previously answered survey
    useEffect(() => {
        
        var loadedResults = JSON.parse(sessionStorage.getItem('loadedResults'));
        var assessmentState = JSON.parse(sessionStorage.getItem('assessmentState'))
        // Direct navigation to /assessment (deep link, bookmark, fresh tab) skips
        // the Home page, which is what normally seeds sessionStorage's userState.
        var userState = JSON.parse(sessionStorage.getItem('userState')) || {};
        userState['page'] = 'assessmentPage';
        userState['has_switched_page'] = false;

        if(loadedResults){
            sessionStorage.setItem('assessmentState', JSON.stringify(loadedResults));

            for (const key in loadedResults) {   
                    if(key.includes("question") && (loadedResults[key] == 0 || 0.25 || 0.5 || 1 )){
                        assessmentState[key] = loadedResults[key]
                        survey.setValue(key,loadedResults[key])
                    }else if(typeof(key == 'string')){
                        assessmentState[key] = loadedResults[key]
                        survey.setValue(key,loadedResults[key])
                    }
            }
            sessionStorage.removeItem('loadedResults')
        }
        if(assessmentState){ 
            for (const key in assessmentState) {   
                survey.setValue(key,assessmentState[key])
            }    
        }
        
        var navbar = sessionStorage.getItem('navbarState');
        
        
        if(pageStateRef.current != navbar){
            changePage(navbar);
        }
        
        // isDetailsPage doesn't need to be resynced here: changePage's trailing
        // if/else (see above) already keeps it equal to `pageState === "Details"` for
        // every path that can change pageState, so it's already consistent by the time
        // this effect runs.
        var userStateData = JSON.parse(sessionStorage.getItem('userState')) || {};

        if (isChangedPage(userStateData['page'])){
            userStateData['page'] = 'assessmentPage';
            userStateData['has_switched_page'] = false;
            sessionStorage.setItem('userState', JSON.stringify(userStateData));
        }

        // Not `setSurvey(survey)`: `surveyState` is always this same `survey`
        // reference (it's a mutated-in-place Model instance, never replaced), so
        // React's setState bails out on an Object.is-equal value and this would never
        // actually schedule a re-render. survey-react-ui's <Survey model={surveyState}>
        // subscribes to survey's own events directly and re-renders itself when
        // values/pages change, independent of this component's state -- which is what
        // actually keeps the UI in sync with the survey.setValue() calls above.
    }, [display, changePage])



    function saveResponses(){
        var a = document.createElement('a');
        var data = JSON.parse(sessionStorage.getItem('assessmentState'));
        a.setAttribute('href', 'data:text/plain;charset=utf-8,'+encodeURIComponent(JSON.stringify(data)));
        var ts = formatDate(new Date());
        console.log(data);
        if (data['Company Name'] != null && data['Company Name'] != "") {
            if (data['Project name'] != null && data['Project name'] != "") {
                var fileName = data['Company Name'] + '-' + data['Project name'] + '-'+ts+'.json';
            } else {
            var fileName = data['Company Name'] + '-'+ts+'.json';
            }
        } else {
            var fileName = "SAMMAssessmentResponses-"+ts+".json";
        }
        a.setAttribute('download', fileName);
        a.click()
    } 

   
    //Handling LoadResults dropDown button functions 
    function handleDropDownButton(value){
        setDropDownState(value);
        isDropDownButtonClickedRef.current = true;
    }
    
    

    function setNavBarState(name){
        var userNavbarState = sessionStorage.getItem('navbarState');
        userNavbarState = name;
        sessionStorage.setItem('navbarState', userNavbarState);
        setPageState(name);
        survey.currentPage = name;
        setSurvey(survey);
    }

    //FirstPage doesn't count as changed page so set to false
    // Assigning this during render (the previous approach) mutates the module-level
    // `survey` singleton as a side effect of rendering, which react-hooks/immutability
    // now flags. useLayoutEffect keeps it synchronous (runs before paint, same as the
    // old render-time assignment) while making the mutation an explicit effect.
    useLayoutEffect(() => {
        survey.showNavigationButtons = "none";
    }, []);

    // Panel-navigation bookkeeping (Next/Previous Practice buttons, collapse state,
    // panel<->DOM element lookup). This used to be plain `var`s re-declared in the
    // render body, with survey.onCurrentPageChanged/onAfterRenderPanel/etc. callbacks
    // re-registered on every render -- survey-core's Event.add() has no
    // de-duplication, so that silently accumulated one extra listener per render for
    // the component's lifetime. Registering once in a mount effect fixes that, and
    // react-hooks/refs requires the registration itself not happen during render.
    // Refs (not module-level state) keep the original per-mount-reset behavior: a
    // fresh Mysurvey instance (e.g. navigating away from /assessment and back) starts
    // with empty panel-tracking state again, same as the old per-render `var`s did.
    const pageChangedRef = useRef(false);
    const panelsRef = useRef([]);
    const currPanelNamesRef = useRef([]);
    const panelStateMapRef = useRef(new Map());
    const panelElementMapRef = useRef(new Map());
    const allPagesRef = useRef(survey.pages);

    useEffect(() => {
        const panels = panelsRef.current;
        const curr_panel_names = currPanelNamesRef.current;
        const panelStateMap = panelStateMapRef.current;
        const panelElementMap = panelElementMapRef.current;
        const all_pages = allPagesRef.current;

        //Reloads arrays with page panel data
        function append_panel_data(in_data){
            for(let i = 0; i < in_data.length;i++){
                curr_panel_names.push(in_data[i].name);
                panels.push(in_data[i]);
            }
        }

        function onCurrentPageChanged(survey, option){
            if (panels.length > 0 && curr_panel_names.length > 0){
                panels.length= 0;
                curr_panel_names.length = 0;
                panelStateMap.clear();
            }
            pageChangedRef.current = true;
            var currPage = option.newCurrentPage;

            append_panel_data(currPage.getPanels());
        }
        survey.onCurrentPageChanged.add(onCurrentPageChanged);

        if(!(pageChangedRef.current)){
            var page = survey.currentPage;
            append_panel_data(page.getPanels())
        }

        function panelInPage(checkPanel){
            if(curr_panel_names.indexOf(checkPanel) > -1){
                return true;
            }
        }

        function panelScroll(targetPanelName){
            var target = panelElementMap.get(targetPanelName);
            if (target){
                target.scrollIntoView({
                    behavior: "smooth"
                });
            }
        }

        function isFirstPanel(index){
            if (index == 0){
                return true;
            } else{
                return false;
            }
        }

        function isLastPanel(index){
            if (index == 2){
                return true;
            } else {
                return false;
            }
        }

        function createPanelButton(rendered_panel, options, button_type, btnID){
            var btn = document.createElement('button');
            btn.type = "button";
            btn.className = "btn btn-info btn-xs";
            btn.id = btnID;
            btn.innerHTML = button_type;
            // Insert buttons into html document
            var header = options.htmlElement;
            var span = document.createElement("span");
            span.id = rendered_panel+"panel";
            span.class = 'span';
            span.innerHTML = "  ";
            header.appendChild(span);
            header.appendChild(btn);
            return btn
        }

        function deleteButton(rendered_panel, btn, btnID){
            btn.remove();
            var span_id = rendered_panel + "panel";
            var span_rem = document.getElementById(span_id)
            span_rem.remove();
        }

        function onAfterRenderPanel(survey, options){
            var rendered_panel = options.panel.name;
            panelElementMap.set(rendered_panel, options.htmlElement);

            var index = curr_panel_names.indexOf(rendered_panel);
            var currentPanel = panels[index];

            // Assert panel is in the current page and isDropDownButtonClicked is not true (i.e., false)
            if(panelInPage(rendered_panel) && (!isDropDownButtonClickedRef.current)){
                var nextID = rendered_panel + "NextNavigator";
                var prevID = rendered_panel + "PrevNavigator";


                if (currentPanel.isCollapsed == true){
                    // initialise panel as a key if not in stateMap
                    if (!(panelStateMap.has(rendered_panel))){
                        panelStateMap.set(rendered_panel, false)
                    } else{
                        var nbutton = document.getElementById(nextID)
                        if (nbutton != null){
                            deleteButton(rendered_panel, nbutton, nextID);
                        }
                        //Only panels 2 and 3 have prevPanel buttons
                        if (!(isFirstPanel(index))){
                            var pbutton = document.getElementById(prevID);
                            if (pbutton != null){
                                pbutton.remove();
                            }
                        }
                    }
                } else if(currentPanel.isCollapsed == false){
                    // Do not apply scroll animation to first panel when page loads
                    if (!(isFirstPanel(index) && !(panelStateMap.has(rendered_panel)))){
                        panelScroll(rendered_panel);
                    }

                    // Check if button exists before appending. Only next button checked because it applies to all panels.
                    if(document.getElementById(nextID) == null){
                        var nextbtnText;

                        if(isLastPanel(index)){
                            nextbtnText = "Next Page";
                        } else{
                            nextbtnText = "Next Practice";
                        }

                        var prevPanel = index - 1;
                        if (!(isFirstPanel(index))){
                            if(document.getElementById(prevID) == null){
                                var prevbtn = createPanelButton(rendered_panel, options, "Previous Practice", prevID);
                                prevbtn.onclick = function () {
                                    panels[index].collapse();
                                    panels[prevPanel].expand();
                                    panelScroll(panels[prevPanel].name)
                                }
                            }
                        }
                        var nextPanel = panels[index + 1];

                        // Next Panel button logic -> applied based on panel index. If last panel => go to next page.
                        if(index < 2){
                            var nextbtn = createPanelButton(rendered_panel, options, nextbtnText, nextID);
                            nextbtn.onclick = function () {
                                nextPanel.expand();
                                currentPanel.collapse();
                                panelScroll(nextPanel.name);
                            }
                        }
                        // Set panel "open" state to true
                        panelStateMap.set(rendered_panel, true)
                    }
                }
            }
            if(isLastPanel(index) && isDropDownButtonClickedRef.current){
                isDropDownButtonClickedRef.current = false
            }

        }
        survey.onAfterRenderPanel.add(onAfterRenderPanel);

        function onUpdateQuestionCssClasses(survey, options) {
            var classes = options.cssClasses
            classes.mainRoot = addClassOnce(classes.mainRoot, "sv_qstn");
            classes.root = "sq-root";
            classes.title = addClassOnce(classes.title, "sq-title");
            classes.description ="sq-description";
            classes.item = addClassOnce(classes.item, "sq-item");
            classes.label = addClassOnce(classes.label, "sq-label");

            if (options.question.isRequired) {
                classes.title = addClassOnce(classes.title, "sq-title-required");
                classes.root = addClassOnce(classes.root, "sq-root-required");
            }
            if (options.question.getType() === "checkbox") {
                classes.root = addClassOnce(classes.root, "sq-root-cb");
            }
        }
        survey.onUpdateQuestionCssClasses.add(onUpdateQuestionCssClasses);

        function onValueChanged(survey, options){
            const assessmentStateData = JSON.parse(sessionStorage.getItem('assessmentState'));
            var question_answered = String(options.name);
            var answer_value = options.value;
            assessmentStateData[question_answered] = answer_value;
            sessionStorage.setItem('assessmentState', JSON.stringify(assessmentStateData));
        }
        survey.onValueChanged.add(onValueChanged);

        return () => {
            survey.onCurrentPageChanged.remove(onCurrentPageChanged);
            survey.onAfterRenderPanel.remove(onAfterRenderPanel);
            survey.onUpdateQuestionCssClasses.remove(onUpdateQuestionCssClasses);
            survey.onValueChanged.remove(onValueChanged);
        };
    }, []);


    function clearAnswers(){
        let isOK = confirm('This will clear all answers do you wish to continue?')
        
        if (isOK){
            
            const assessmentState = JSON.parse(sessionStorage.getItem('assessmentState'));
            for (const key in assessmentState) {   
                assessmentState[key] = null  
            }    
            
            
            sessionStorage.setItem('assessmentState', JSON.stringify(assessmentState));
        
            if (sessionStorage.getItem('prevResults') !== null) {
                sessionStorage.removeItem('prevResults');
            }
        
           // router.reload()
            setDisplay(!display)
        }

    }

    
// return a page full of the Survey.JS json that was built in the "surveys" Folder 
    return (
        <>
            <h2>Would you like to use previous results to populate the questionnaire?</h2>
            <p>If you have a file of unfinished results that you wish to go back to you can upload them here and the questionnaire will autopopulate with your answers</p>
            <DropButton name = "Load Results" state ={dropDownState} onClick= {value =>handleDropDownButton(value)}/>
                {dropDownState? <InputFile fileName="loadedResults" pageName="assesment"/>:null}

            <div className = "pageNav">
            
                    <SurveyButton name="Clear" boolean ={false} onClick={() => clearAnswers(true)}/>

                    <button className="SaveResponses" onClick={()=> saveResponses()}> Save Responses </button>
                        
            </div>
            
                    
            <SurveyNav button = {pageState} onClick = {value => changePage(value)}/>
            <Survey  showCompletedPage={false}
                onComplete = {data => prop.showCompletedPage(data.valuesHash)}
                model = {surveyState} 
                />
            
            <div className="pageNav">
                {isDetailsPage?
                    <>
                        <button className="NextPage" onClick={()=> changePage("next")}> Complete </button>
                    </>
                :
                <>
                        <button className="NextPage" onClick={()=> changePage("next")}> Next Page </button>
                </>       
                }
            </div>
        </>
       
    );
}
 
export default Mysurvey;
