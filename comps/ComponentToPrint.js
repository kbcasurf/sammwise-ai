import InputFile from '../comps/inputfile';
import Dataset from '../comps/surveyDisplay/graphs/datasetprops';
import {Radar, Doughnut, Bar} from 'react-chartjs-2';
import GaugeChart from 'react-gauge-chart'
import React from 'react';
//This component is for refactoring results page so the print button can be added. 

class ComponentToPrint extends React.PureComponent {
    
    constructor(props){
        super(props);
        this.state = {
            completionText: props.completionText,
            projectName: props.projectName,
            projectDesc: props.projectDesc,
            finalScore: props.finalScore,
            percentageScore: props.percentageScore,
            graphObjects: props.graphObjects,
        };
    }
    
    render() {
      return (
        <>
            <div>
                </div>
                <div label='TOTALS' id="totalsDiv">
                <div className="flexWrap">
                    <div className="flexBoxFull" id="box1">
                        <script>
                            console.log(finalScore)
                        </script>
                        {/* <h2 id="finalscore">Your overall score is {this.props.finalScore}</h2> */}
                        <GaugeChart id="gauge-chart2" nrOfLevels={4} percent={this.props.percentageScore} textColor ={"#000000"} colors={[" #ff6384","#ff9f40","#ffcd56","#4bc0c0"]} className="gauge"/>
                        <h2 id="totalsbargraph"> Bar graph of totals </h2>
                        <Bar data = {this.props.graphObjects['totalsbar'].metaData} options = {this.props.graphObjects['totalsbar'].layout_props} className='totalsBar' />
                    </div>
                </div>
            </div>
            <div label='Business Functions'>
                <div className="flexWrap">
                    <div className="flexBoxHalf bussFuncRadarBox">
                        <h2 id = "busfuncradargraph">Business function Radar Graph</h2>
                        <Radar data = {this.props.graphObjects['bussFuncRadar'].metaData}  options = {this.props.graphObjects['bussFuncRadar'].layout_props}/>
                    </div>
                    <div className="flexBoxHalf bussFuncBarBpx">
                        <h2 id = "busfuncbargraph"> Business Functions Bar Graph </h2>
                        <Bar data = {this.props.graphObjects['bussFuncBar'].metaData} options = {this.props.graphObjects['bussFuncBar'].layout_props} className='bussFuncBarGraph'/>
                    </div>
                </div>
            </div>
            <div label='Practices' className="practices">
                <div className="flexWrap">
                    <div className="flexBoxHalf practiceRadarBox">
                        <h2 id = "pracradargraph">Practices Radar Graph</h2>
                        <Radar  data = {this.props.graphObjects['practiceRadar'].metaData}  options = {this.props.graphObjects['practiceRadar'].layout_props} />
                    </div>
                    <div className="flexBoxHalf practicesBarBox">
                        <h2 id ="pracbargraph"> Practices Bar Graph </h2>
                        <Bar data = {this.props.graphObjects['practiceBar'].metaData} options = {this.props.graphObjects['practiceBar'].layout_props} />
                    </div>
                </div>
            </div>
        </> 
      );
    }
}

export default ComponentToPrint;