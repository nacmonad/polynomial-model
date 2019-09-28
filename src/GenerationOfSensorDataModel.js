import PolynomialRegression from 'ml-regression-polynomial';

var tf = require('@tensorflow/tfjs');

// const learningRate = 0.5;
// const optimizer = tf.train.sgd(learningRate);
export default ([xs,ys], maximumDegree, GAMMA)=>{
  const models = [];


  const executePolyfit = (l, h, deg) => {
      console.log(`execute degree ${deg} polyfit: ${l} to ${h}`)

      try {
        console.log("xs")
        console.log(xs.slice(l,h))
        console.log(ys.slice(l,h))
        let regression = new PolynomialRegression(xs.slice(l,h),ys.slice(l,h), deg);
        console.log(regression)
        let p = regression.coefficients;
        console.log(p)
        for(var j = l; j < h; j++) {
          let predictedValue = regression.predict(xs[j]);
          let absoluteError = Math.abs(predictedValue-ys[j]);
          console.log(`predicted: ${predictedValue} actual:${ys[j]} absErr:${absoluteError}`)
          if(h-l <= 1) {
            models.push([xs[l],ys[l]]) //just a point in this case
            return;
          }
          if(deg > maximumDegree) {
            let m = Math.floor(l + (h-l)/2);
            executePolyfit(l,m,1);
            executePolyfit(m,h,1);
            return;
          }
          if(absoluteError > GAMMA) {
            executePolyfit(xs[l],h, deg+1);
            return;
          }
        }

        //another compression -~1%
        if(p.length === 2 && p[1] === 0) {
          //console.log("SUBZERO")
          models.push([xs[l], p[0]])
        } else {
            models.push([xs[l],...p])
        }

      } catch (e) {
        console.log(e)//   ignors LU error in ml-matrix library
        if(h-l <= 1) {
          models.push([xs[l], ys[l]]) //implied to just be x,y point
          return;
        }
        if(deg > maximumDegree) {
          let m = Math.floor(l + (h-l)/2);
          executePolyfit(l,m,1);
          executePolyfit(m,h,1);
        } else {
          executePolyfit(l,h, deg+1);
        }
        return;
      }
      return 1;
  }


  console.log("processing max degree, gama " + maximumDegree + ', ' + GAMMA)

  let degree = 1;
  let low = 0;
  let high = xs.length;

  executePolyfit(low,high,degree);
  return models;
}
