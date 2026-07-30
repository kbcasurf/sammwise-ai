// react imports
import {Radar, Doughnut, Bar} from 'react-chartjs-2';
import GaugeChart from 'react-gauge-chart'
import React, {useState,useEffect, useRef} from 'react';
import Head from 'next/head'
import { useReactToPrint } from 'react-to-print';
import {useRouter} from 'next/router'

//local imports
import surveyCalculatorJSON from '../comps/surveyDisplay/calculator';
import DonutGraph from '../comps/surveyDisplay/graphs/donutgraph';
import SpiderGraph from '../comps/surveyDisplay/graphs/spidergraph';
import Bargraph from '../comps/surveyDisplay/graphs/bargraph';
import InputFile from '../comps/inputfile';
import Dataset from '../comps/surveyDisplay/graphs/datasetprops';
import ComponentToPrint from '../comps/ComponentToPrint';
import assessmentCalculator from '../comps/surveyDisplay/graphs/testCalculator';
import SurveyButton from '../comps/buttons/surveybuttons';
import GapAnalysisConsent from '../comps/gapAnalysis/GapAnalysisConsent';
import GapAnalysisReport from '../comps/gapAnalysis/GapAnalysisReport';
import { getTestCalculatorPracticeAlias } from '../lib/gapAnalysis/sammQuestionMap';

var completionText
var dataENV = []
var finalScore = [0,0]
var percentageScore = 0
var overallScoreRaw = null
var projectName 
var projectDesc 
var companyname = "Results"

const donutGraph = new DonutGraph()
const practiceRadar = new SpiderGraph()
const bussFuncRadar = new SpiderGraph()
bussFuncRadar.set_title_text("business function")
practiceRadar.set_title_text("practice")
const totalsBarGraph =  new Bargraph()
const bussFuncBarGraph = new Bargraph()
const practiceBarGraph = new Bargraph()
const additionalDataset = new Dataset()
totalsBarGraph.set_aspect_ratio(3)
bussFuncBarGraph.set_aspect_ratio(1)
practiceBarGraph.set_aspect_ratio(1)
var l = ["No","Yes, for some","Yes, for most","Yes, for all"]
totalsBarGraph.set_labels(l)



var graphObjects = {
    'donut_graph':donutGraph,
    'practiceRadar': practiceRadar,
    'practiceBar': practiceBarGraph,
    'bussFuncRadar': bussFuncRadar,
    'bussFuncBar': bussFuncBarGraph, 
    'totalsbar': totalsBarGraph
}

//function to save file to local computer
function saveText(text, filename){
    var a = document.createElement('a');
    a.setAttribute('href', 'data:text/plain;charset=utf-8,'+encodeURIComponent(text));
    a.setAttribute('download', filename);
    a.click()
}

// react-chartjs-2 decides whether to push new numbers into the Chart.js instance by
// comparing the *reference* of data.datasets between renders. Mutating
// graphObj.metaData.datasets[dataNum].data in place (the old pattern here) never
// changes that reference, so the chart silently keeps rendering its initial (empty)
// data. Reassigning the datasets array forces react-chartjs-2 to detect the change.
function setDatasetData(graphObj, dataNum, data) {
  if (!graphObj.metaData.datasets[dataNum]) {
    throw new Error(`setDatasetData: no dataset at index ${dataNum}`);
  }
  graphObj.metaData.datasets = graphObj.metaData.datasets.map((d, i) =>
    i === dataNum ? { ...d, data } : d
  );
}

const Results = () => {

    
    
    const[display,setDisplay] = useState(0)
    const[showPrevious, setShowPrevious] = useState(false)
    const[saveMessage, setSaveMessage] = useState('')
    const[isSaving, setIsSaving] = useState(false)
    const[aiReportEnabled, setAiReportEnabled] = useState(false)
    const[consentVisible, setConsentVisible] = useState(false)
    const[reportVisible, setReportVisible] = useState(false)
    const[reportLoading, setReportLoading] = useState(false)
    const[reportError, setReportError] = useState(false)
    const[report, setReport] = useState(null)
    const[savedAssessmentId, setSavedAssessmentId] = useState(null)
    const[attachMessage, setAttachMessage] = useState('')
    const[isAttaching, setIsAttaching] = useState(false)
    const[practiceScoresByName, setPracticeScoresByName] = useState({})
    const componentRef = useRef();
    const router = useRouter();
    const handlePrint = useReactToPrint({ contentRef: componentRef });
    const reducer = (prevValue, currValue) => prevValue + currValue;
    function reloadPage(){
        location.reload();
    }

    async function saveToHistory(){
        if (isSaving) return;
        setSaveMessage('')
        setIsSaving(true)
        try {
            const response = await fetch('/api/assessments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: dataENV[0], overallScore: overallScoreRaw }),
            });
            if (!response.ok) {
                throw new Error('Failed to save assessment');
            }
            const result = await response.json();
            setSavedAssessmentId(result.id);
            setSaveMessage('Assessment saved to history.');
        } catch (err) {
            setSaveMessage('Unable to save to history. Please try again.');
        } finally {
            setIsSaving(false)
        }
    }

    async function handleGenerateReport(){
        if (reportLoading) return;
        setConsentVisible(false)
        setReportVisible(true)
        setReportLoading(true)
        setReportError(false)
        setReport(null)
        try {
            // Only send the question answers to our own /api/gap-analysis endpoint,
            // not the full assessment state (which also carries 'Company Name',
            // 'Project name' and 'Description of Project' as sibling keys) — the
            // server filters these out before prompting the AI provider, but they
            // shouldn't cross the wire from the browser at all.
            const answers = Object.fromEntries(
                Object.entries(dataENV[0]).filter(([key]) => key.startsWith('question'))
            );
            const response = await fetch('/api/gap-analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers }),
            });
            if (!response.ok) {
                throw new Error('Gap analysis request failed');
            }
            const result = await response.json();
            setReport(result);
        } catch (err) {
            setReportError(true)
        } finally {
            setReportLoading(false)
        }
    }

    async function handleAttachToHistory(){
        if (!savedAssessmentId || !report || isAttaching) return;
        setIsAttaching(true)
        setAttachMessage('')
        try {
            const response = await fetch(`/api/assessments/${savedAssessmentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gapAnalysisReport: report }),
            });
            if (!response.ok) {
                throw new Error('Failed to attach report');
            }
            setAttachMessage('Report attached to history.')
        } catch (err) {
            setAttachMessage('Unable to attach report. Please try again.')
        } finally {
            setIsAttaching(false)
        }
    }

    useEffect(() => {
        fetch('/api/config')
            .then((res) => (res.ok ? res.json() : { aiReportEnabled: false }))
            .then((cfg) => setAiReportEnabled(!!cfg.aiReportEnabled))
            .catch(() => setAiReportEnabled(false));
    }, [])

        useEffect( () => {
            if (!router.isReady) return;

            async function loadResults() {

            const sessionData = sessionStorage.getItem('dataResults');
            let previousData = sessionStorage.getItem('prevResults');

            const compareId = router.query.compareId;
            if (!previousData && compareId) {
                try {
                    const response = await fetch(`/api/assessments/${compareId}`);
                    if (response.ok) {
                        const record = await response.json();
                        previousData = JSON.stringify(record.data);
                    }
                } catch (err) {
                    console.error('Failed to load comparison assessment', err);
                }
            }

            const assessmentSessionStateData = JSON.parse(sessionStorage.getItem('assessmentState'));
            
            
            var answer_values = []
            // fill values array 
            for (const key in assessmentSessionStateData){
                answer_values.push(assessmentSessionStateData[key]);
            }
            var answer_sum = answer_values.reduce(reducer);
            // Direct navigation to /results (deep link, bookmark, fresh tab) skips
            // the Home page, which is what normally seeds sessionStorage's userState.
            var userStateUpdate = JSON.parse(sessionStorage.getItem('userState')) || {};
            userStateUpdate['page'] = 'resultsPage';
            userStateUpdate['has_switched_page'] = true;
            sessionStorage.setItem('userState', JSON.stringify(userStateUpdate));
            
         
            if (assessmentSessionStateData){
                dataENV[0] = assessmentSessionStateData;
                
                // if(assessmentSessionStateData && !(previousData && dataENV[0])){
                //     dataENV[0] = assessmentSessionStateData;
                // }
                if(previousData) {
                    setShowPrevious(true);
                    dataENV[1] = JSON.parse(previousData);
                    if(bussFuncBarGraph.metaData.datasets.length < 2){
                        totalsBarGraph.metaData.datasets.push(new Dataset().metaData);
                        bussFuncBarGraph.metaData.datasets.push(new Dataset().metaData);
                        practiceBarGraph.metaData.datasets.push(new Dataset().metaData);
                    }

                } else {
                    // Next.js keeps this page component mounted across client-side
                    // pushState navigation (e.g. leaving /results?compareId=X for plain
                    // /results). Without this reset, module-level dataENV and the bar
                    // graphs' pushed "previous" dataset from an earlier render would
                    // linger and keep showing a stale comparison that no longer applies.
                    setShowPrevious(false);
                    if (dataENV.length > 1) {
                        dataENV.length = 1;
                    }
                    if (totalsBarGraph.metaData.datasets.length > 1) {
                        totalsBarGraph.metaData.datasets = totalsBarGraph.metaData.datasets.slice(0, 1);
                        bussFuncBarGraph.metaData.datasets = bussFuncBarGraph.metaData.datasets.slice(0, 1);
                        practiceBarGraph.metaData.datasets = practiceBarGraph.metaData.datasets.slice(0, 1);
                    }
                    // Unlike the bar graphs, SpiderGraph always has a fixed
                    // "Previous Assessment" dataset slot (index 1) from
                    // construction, so it never gets re-populated by the
                    // dataNum loop below once dataENV is trimmed back to 1 —
                    // clear it explicitly or it keeps drawing stale data.
                    setDatasetData(bussFuncRadar, 1, []);
                    setDatasetData(practiceRadar, 1, []);
                }
                completionText = 'Thank you for completing the questionnaire'   
                
                // put all relevant data in to the JSON for the Charts
                // surveyCalculator JSON returns the sorted scores from the survey where Pages
                // are business functions and Panels are the sub categories
                // if(!display){
                    // Only push to graph if survey values have any inputs 
            
                // if(answer_values.reduce(reducer) > 0){
                    for(let dataNum = 0; dataNum < dataENV.length;dataNum++){
                       
                        
                        // var calcResultsJSON = surveyCalculatorJSON(dataENV[dataNum])
                        var testCalc = new assessmentCalculator(dataENV[dataNum]);
                        testCalc.computeResults();
                        
                        var totalsBarGraphData = [0,0,0,0]
                        
                        bussFuncRadar.metaData.labels = testCalc.businessFunctionNames;
                        bussFuncBarGraph.metaData.labels = testCalc.businessFunctionNames;

                        setDatasetData(bussFuncRadar, dataNum, testCalc.businessFunctionScores);
                        setDatasetData(bussFuncBarGraph, dataNum, testCalc.businessFunctionScores);
                        
                        
                        practiceRadar.metaData.labels = testCalc.practiceNames;
                        practiceBarGraph.metaData.labels = testCalc.practiceNames;
                        setDatasetData(practiceRadar, dataNum, testCalc.practiceScores);
                        setDatasetData(practiceBarGraph, dataNum, testCalc.practiceScores);

                        // for (let i = 0; i < 5; i++) {
                           
                        //     if(bussFuncBarGraph.metaData.labels.length<5){
                        //         bussFuncRadar.metaData.labels.push(calcResultsJSON.Pages[i].name)
                        //         bussFuncBarGraph.metaData.labels.push(calcResultsJSON.Pages[i].name)
                        //         bussFuncRadar.metaData.datasets[dataNum].data.push(calcResultsJSON.Pages[i].score)
                        //         bussFuncBarGraph.metaData.datasets[dataNum].data.push(calcResultsJSON.Pages[i].score)
                                
                           
                        //     }else{
                        //         bussFuncRadar.metaData.datasets[dataNum].data[i] = calcResultsJSON.Pages[i].score
                        //         bussFuncBarGraph.metaData.datasets[dataNum].data[i] = calcResultsJSON.Pages[i].score
                        //     }
                        // }
                        //     for (let j = 0; j < 3; j++) {
                        //         if (practiceBarGraph.metaData.labels.length<15)
                        //         { 
                                    
                        //             practiceRadar.metaData.labels.push(calcResultsJSON.Pages[i].panels[j].name)
                        //             practiceBarGraph.metaData.labels.push(calcResultsJSON.Pages[i].panels[j].name)
                        //             practiceRadar.metaData.datasets[dataNum].data.push(calcResultsJSON.Pages[i].panels[j].score)
                        //             practiceBarGraph.metaData.datasets[dataNum].data.push(calcResultsJSON.Pages[i].panels[j].score) 
                                    
                                    
                        //         }
                        //         // else{
                        //         //     practiceRadar.metaData.datasets[0].data[i]= calcResultsJSON.Pages[i].panels[j].score
                        //         //     practiceBarGraph.metaData.datasets[0].data[i]= calcResultsJSON.Pages[i].panels[j].score
                        //         // }
                        //         // if(dataNum==1){
                        //         //     practiceRadar.metaData.datasets[1].data.push(calcResultsJSON.Pages[i].panels[j].score)
                        //         //     practiceBarGraph.metaData.datasets[1].data.push(calcResultsJSON.Pages[i].panels[j].score) 
                        //         // }   
                                
                        //         // console.log("This is the array in 2: "+  bussFuncBarGraph.metaData.datasets[dataNum].data)
                        //         //Applying each score the array 
                            
                        //         for(let g = 0; g<6;g++){
                        //             if(calcResultsJSON.Pages[i].panels[j].answers[g] == 0){
                        //                 totalsBarGraphData[0]++
                        //             }
                        //             if(calcResultsJSON.Pages[i].panels[j].answers[g] == 0.25){
                        //                 totalsBarGraphData[1]++
                        //             }
                        //             if(calcResultsJSON.Pages[i].panels[j].answers[g] == 0.5){
                        //                 totalsBarGraphData[2]++
                        //             }
                        //             if(calcResultsJSON.Pages[i].panels[j].answers[g] == 1){
                        //                 totalsBarGraphData[3]++
                        //             }
                        //         }
                            
                        //     } 
                        // }


                        totalsBarGraphData[0] = testCalc.responseCount["No"]
                        totalsBarGraphData[1] = testCalc.responseCount["Yes, for some"]
                        totalsBarGraphData[2] = testCalc.responseCount["Yes, for most"]
                        totalsBarGraphData[3] = testCalc.responseCount["Yes, for all"]
                        console.log(testCalc.responseCount);
                        var totalsCount = [ testCalc.responseCount["No"],testCalc.responseCount["Yes, for some"], testCalc.responseCount["Yes, for most"], testCalc.responseCount["Yes, for all"]];


                        setDatasetData(totalsBarGraph, dataNum, totalsCount);
                        
                        //Pushing to the Graph
                           
                        for (let index = 0; index < totalsBarGraphData.length; index++) {
                            donutGraph.update_properties_dataset(index)
                            //  if(answer_sum > 0){
                            //      console.log('totals graph data gets data'); 
                                // totalsBarGraph.metaData.datasets[dataNum].data.push(totalsBarGraphData[index])
                            //  }
                        }
                        finalScore[dataNum]= testCalc.overallScore.toFixed(2);
                        if (dataNum === 0) {
                            overallScoreRaw = testCalc.overallScore;
                            const scoresByName = {};
                            testCalc.practiceNames.forEach((name, idx) => { scoresByName[getTestCalculatorPracticeAlias(name)] = testCalc.practiceScores[idx]; });
                            setPracticeScoresByName(scoresByName);
                        }

                        percentageScore = (finalScore[dataNum] /3).toFixed(2);
                        console.log(percentageScore)
                        
                        //if(totalsBarGraph.metaData.datasets[0].data[0] > 0 && answer_sum == 0){
                      //      totalsBarGraph.metaData.datasets[0].data[0] = 0;
                      //  }
                        
                        console.log(finalScore[dataNum])
                        console.log(finalScore);
                        companyname = dataENV[dataNum]['Company Name']
                        completionText+=" "+ companyname
                        projectName = dataENV[dataNum]["Project name"]
                        projectDesc = dataENV[dataNum]["Description of Project"]
                    // }
                }
                setDisplay(1)
            } 
        else{
                
                completionText = 'You must first complete the questionnaire to see results'
            }
            }

            loadResults();
        }, [router.isReady, router.query.compareId])
            
                           
           return(
            <>
                <Head>
                    <title>SAMMWise | Results </title>
                    <meta name = "keywords" content = "owassp-calc"/>
                </Head>
                <h1>{completionText}</h1>
                <h1>{projectName}</h1>
                <p>{projectDesc}</p>
                <div ref={componentRef}>
                    <div>
                        <SurveyButton name="Refresh Graphs" onClick={()=> reloadPage()} />
                    </div>
                    <div label='TOTALS' id="totalsDiv">
                        <div className="flexWrap">
                            <div className="flexBoxFull totalGraphs" id="box1">
                                {/* <h2 id="finalscore">{showPrevious? 'Your overall score is: '+ finalScore[0] + ' Your score last time was: ' +finalScore[1]:'Your overall score is: '+ finalScore[0]}</h2>
                                <GaugeChart id="gauge-chart2" nrOfLevels={4}   textColor ={"#000000"} colors={[" #ff6384","#ff9f40","#ffcd56","#4bc0c0"]} className="gauge"/> */}
                                <h2 id="finalscore">{showPrevious? 'Your overall score is: '+ finalScore[0]+'/3' + ' Your score last time was: ' +finalScore[1] +'/3':'Your overall score is: '+ finalScore[0] +'/3'}</h2>
                                <GaugeChart id="gauge-chart2" nrOfLevels={4}  percent={percentageScore} textColor ={"#000000"} colors={[" #ff6384","#ff9f40","#ffcd56","#4bc0c0"]} className="gauge"/>
                                <h2 id="totalsbargraph" className="totalsBarHeader"> Response count by value </h2>
                                <Bar data = {totalsBarGraph.metaData} options = {totalsBarGraph.layout_props} className='totalsBar' />
                            </div>
                        </div>
                    </div>
                    <div label='Business Functions'>
                        <div className="flexWrap">
                            <div className="flexBoxHalf bussFuncRadarBox">
                                <h2 id = "busfuncradargraph"> Maturity by Business Function </h2>
                                <Radar data = {bussFuncRadar.metaData}  options = {bussFuncRadar.layout_props} className='bussFuncRadar'/>
                            </div>
                            <div className="flexBoxHalf bussFuncBarBox">
                                <h2> Maturity by Business Function </h2>
                                <Bar data = {bussFuncBarGraph.metaData} options = {bussFuncBarGraph.layout_props} className='bussFuncBar'/>
                            </div>
                        </div>
                    </div>
                    <div label='Practices' className="practices">
                        <div className="flexWrap">
                            <div className="flexBoxHalf practiceRadarBox">
                                <h2 id = "pracradargraph"> Maturity by Practice </h2>
                                <Radar  data = {practiceRadar.metaData}  options = {practiceRadar.layout_props} className='practiceRadar'/>
                            </div>
                            <div className="flexBoxHalf practicesBarBox">
                                <h2 id ="pracbargraph"> Maturity by Practice </h2>
                                <Bar data = {practiceBarGraph.metaData} options = {practiceBarGraph.layout_props} className='practiceBar'/>
                            </div>
                        </div>
                    </div>
                </div>
                    <div className="jsonDownload">     
                        <h2 className="jsonDownload">Do you wish to save your results file in JSON?</h2>
                        <button className = 'btn'
                            onClick={()=> saveText(JSON.stringify(dataENV[0]), JSON.stringify(companyname)+JSON.stringify(projectName)+".json")}>
                                Save file
                        </button>
                        <button className='btn' onClick={() => saveToHistory()} disabled={isSaving}>
                                Save to history
                        </button>
                        {saveMessage && <p className="historySaveMessage">{saveMessage}</p>}
                        {aiReportEnabled && (
                            <>
                                <h2 className="jsonDownload">Do you wish to generate an AI gap analysis report?</h2>
                                <button className="btn" onClick={() => setConsentVisible(true)}>
                                    Generate Gap Analysis Report
                                </button>
                                {report && savedAssessmentId && (
                                    <button className="btn" onClick={() => handleAttachToHistory()} disabled={isAttaching}>
                                        Attach report to history
                                    </button>
                                )}
                                {attachMessage && <p className="historySaveMessage">{attachMessage}</p>}
                            </>
                        )}
                        <h2 className="jsonDownload">Do you wish to load your previous results to compare?</h2>
                        <InputFile fileName = 'prevResults' className="jsonDownload"/>
                    </div>
                
                {/* <ComponentToPrint completionText = {completionText} projectName = {projectName} projectDesc = {projectDesc} finalScore = {finalScore} graphObjects={graphObjects}/> */}
            
            <div>
                <h2 className='jsonDownload'> Do you wish to print or save the graphs as a pdf?</h2>
                    <button className='btn' onClick={() => handlePrint()}>Export graphs</button>
            </div>

            <GapAnalysisConsent
                visible={consentVisible}
                onCancel={() => setConsentVisible(false)}
                onConfirm={handleGenerateReport}
            />
            <GapAnalysisReport
                visible={reportVisible}
                loading={reportLoading}
                error={reportError}
                report={report}
                practiceScores={practiceScoresByName}
                onClose={() => setReportVisible(false)}
            />
            </>
        );
}
 
export default Results;