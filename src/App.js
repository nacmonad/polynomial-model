import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import CircularProgress from '@material-ui/core/CircularProgress'
import InputLabel from '@material-ui/core/InputLabel';
import Slider from '@material-ui/core/Slider';
import PlayIcon from '@material-ui/icons/PlayArrow'

import {Curve, VictoryLine, VictoryChart, VictoryScatter, VictoryTheme} from 'victory';

import RoughSizeOfObject from './RoughSizeOfObject';
import GenerationOfSensorDataModel from './GenerationOfSensorDataModel'
import * as d3 from 'd3';

import io from 'socket.io-client';

const useStyles = makeStyles(theme=>({
  root:{

  },
  topArea:{
    //backgroundColor:'pink'
  },
  chartArea:{

  },
  sliderWrapper:{
    maxWidth:'12rem'
  }
}))

var sio = io.connect('http://localhost:3030');


function App() {

  const [maxDegree, setMaxDegree] = React.useState(5)
  const [maxError, setMaxError] = React.useState(1)
  const [data, setData] = React.useState([]);
  const [xs, setXs] = React.useState([]);
  const [models, setModels] = React.useState([]);
  const [loading, setLoading] = React.useState(false)
  const [socketId, setSocketId] = React.useState('');
  const [socket, setSocket] = React.useState({});
  const [polynomials, setPolynomials] = React.useState([]);
  const [compression, setCompression] = React.useState(-1);
  const [lines, setLines] = React.useState([])
  const [state, setState] = React.useState({})

  const classes = useStyles();

  function handleError(error) {
    console.log(error)
  }
  function handlePlay() {
    setLoading(true);
    setPolynomials([]);
    try {
      socket.emit('request', { type: 'run-model', data: {
        maxDegree: maxDegree,
        maxError: maxError
      } });

    } catch(e) {
      console.log(e)
    }
  }


  function fetchDataAndConnectSocket() {
    try {
      let xvals;
      let yvals;
      fetch(`http://localhost:3030/data`)
        .then((res)=> res.json())
        .then((data)=>{
          xvals = data.xs
          yvals = data.ys
          console.log("SET Xs")
          console.log(xvals)
          setXs(xvals)
          setData(xvals.map((x,i)=>({x:x, y: yvals[i]})))
        })

        //setup socket
        sio.on('connect', function(c) {

          setSocketId(sio.id)
          setSocket(sio)
          sio.on('event', function (event) {

            switch(event.type){
              case 'add-poly':
                console.log("DRAW LINE!")
                var line = [];
                event.data.map(p=>{
                    for(var i=event.data[0][0]; i<=event.data[0][1]; i++) {
                      line.push({x:xvals[i], y: event.data.slice(1).map((c,deg)=>{
                            return c*xvals[i]**deg
                          }).reduce((a,b)=> a+b)})
                    }});
                setPolynomials(prevPol=> [...prevPol, event.data])
                setLines(prevLines=> [...prevLines, line])
                break;
              case 'set-models':
                setModels(event.data.models)
                setLoading(false);
                setCompression(event.data.compression);
                break;
              default:
                console.log("UNHANDLED " + event.type)
            }

          });


        })


    } catch (e) {
      console.log(e)
      setLoading(false);

    }
  }
  //fetch startup data
  React.useEffect(()=>{
    fetchDataAndConnectSocket();
  },[] )
  console.log("Lines:")
  console.log(lines)
  return (
    <div className="App">
    <div className={classes.topArea}>
            {loading && <CircularProgress/>}
            {!loading &&
            <IconButton onClick={handlePlay}>
              <PlayIcon/>
            </IconButton>}
            <div className={classes.sliderWrapper}>
              <InputLabel>MaxDegree: {maxDegree}</InputLabel>
              <Slider
                defaultValue={5}
                value={maxDegree}
                onChange={(e,v)=>{
                  setMaxDegree(v)
                }}
                aria-labelledby="discrete-slider-small-steps"
                step={1}
                marks
                min={1}
                max={8}
                valueLabelDisplay="auto"
              />
            </div>
            <div className={classes.sliderWrapper}>
              <InputLabel>MaxError: {maxError}</InputLabel>
              <Slider
                defaultValue={1}
                aria-labelledby="discrete-slider-small-steps"
                onChange={(e,v)=>{
                  setMaxError(v)
                }}
                value={maxError}
                step={0.1}
                marks
                min={0.1}
                max={10}
                valueLabelDisplay="auto"
              />
            </div>
            {compression > 0 &&
              <InputLabel>Data Model Compression Results {compression} %</InputLabel>
            }
      </div>
      <div className={classes.chartArea}>
      {data.length > 0 &&
        <VictoryChart
          theme={VictoryTheme.material} domain={{ x: [data[0].x, data[data.length-2].x], y: [data.map(d=>d.y).reduce((a,b)=> b < a ? b : a)-2, data.map(d=>d.y).reduce((a,b)=> b > a ? b : a) +2] }}
        >
        <VictoryScatter
          style={{ data: { fill: "#c43a31" } }}
          size={2}
          data={ data }
        />
        {lines.map(l=>{
          return (
            <VictoryLine
              key={l[0]}
              size={2}
              data={ l }
              interpolation="natural"
            />
            )
        })
      }
        </VictoryChart>
      }
      </div>
    </div>
  );
}

export default App;
