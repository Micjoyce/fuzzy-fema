'use strict'

var _ = require("lodash");
//Converter Class
var Converter = require("csvtojson").Converter;
var converter = new Converter({});
var async = require('async');



var testData = [{
  s: 2.86,
  o: 3.13,
  d: 3.96
}];
var testResult = 4.07;
// get val is or not in arr,eq: [2,8], 3 --> true
function isInRange(arr, val) {
  if (!_.isArray(arr)) {
    console.log("arr: " + arr + ", not a array");
    return;
  }
  if (!val || !_.isNumber(val)) {
    console.log("val: " + val + "not value or not a number");
    return;
  }
  var start = _.min(arr);
  var end = _.max(arr);
  if (val >= start && val < end) {
    return true;
  }
  return false;
}
// defined
function memberShip(val) {
  var funcs = [{
    range: [0, 2],
    formula: {
      x: -1 / 2,
      b: 1
    },
    state: "Almost none"
  }, {
    range: [1, 2.5],
    formula: {
      x: 2 / 3,
      b: -2 / 3
    },
    state: "Low"
  }, {
    range: [2.5, 4],
    formula: {
      x: -2 / 3,
      b: 8 / 3
    },
    state: "Low"
  }, {
    range: [3, 5],
    formula: {
      x: 1 / 2,
      b: -3 / 2
    },
    state: "Medium"
  }, {
    range: [5, 7],
    formula: {
      x: -1 / 2,
      b: 7 / 2
    },
    state: "Medium"
  }, {
    range: [6, 7.5],
    formula: {
      x: 2 / 3,
      b: -4
    },
    state: "High"
  }, {
    range: [7.5, 9],
    formula: {
      x: -2 / 3,
      b: 6
    },
    state: "High"
  }, {
    range: [8, 10],
    formula: {
      x: 1 / 2,
      b: -4
    },
    state: "Very high"
  }, ];
  var memberShips = [];
  for (var i = 0; i < funcs.length; i++) {
    var item = funcs[i];
    if (isInRange(item.range, val)) {
      var rate = item.formula.x * val + item.formula.b;
      memberShips.push({
        state: item.state,
        rate: rate
      })
    }
  }

  return memberShips;
}

//RPN
var RPN = [{
  state: "None",
  scores: 1
}, {
  state: "Very low",
  scores: 2
}, {
  state: "Low",
  scores: 3
}, {
  state: "High low",
  scores: 4
}, {
  state: "Low medium",
  scores: 5
}, {
  state: "Medium",
  scores: 6
}, {
  state: "High medium",
  scores: 7
}, {
  state: "Low high",
  scores: 8
}, {
  state: "High",
  scores: 9
}, {
  state: "Very high",
  scores: 10
}]


// sShips: [ { state: 'Low', rate: 0.76 } ]
// oShips:[ { state: 'Low', rate: 0.5800000000000001 },
//   { state: 'Medium', rate: 0.06499999999999995 } ]
// dShips:[ { state: 'Low', rate: 0.02666666666666684 },
//   { state: 'Medium', rate: 0.48 } ]
function analyzeOSD(sShips, oShips, dShips, rules, _cb) {
  if (!_.isArray(sShips) || !_.isArray(oShips) || !_.isArray(dShips)) {
    console.log("sShips || oShips || dShips" + " not a array. sShips: " + sShips, "oShips: ", oShips, "dShips: ", dShips);
    return;
  }

  async.waterfall([
    function(callback) {
      // 生成多少中状态组合
      var states = [];
      for (var i = 0; i < sShips.length; i++) {
        var s = sShips[i];
        for (var j = 0; j < oShips.length; j++) {
          var o = oShips[j];
          for (var k = 0; k < dShips.length; k++) {
            var d = dShips[k];
            states.push({
              s: {
                state: s.state,
                rate: s.rate
              },
              o: {
                state: o.state,
                rate: o.rate
              },
              d: {
                state: d.state,
                rate: d.rate
              }
            });
          }
        }
      }
      callback(null, states);
    },
    function(states, callback) {
      // 找到各个状态中最小值
      for (var i = 0; i < states.length; i++) {
        var state = states[i];
        var min = _.min([state.s.rate, state.o.rate, state.d.rate]);
        state.min = min;
      }
      callback(null, states);
    },
    function(states, callback) {
      // 从rules 找出各种状态
      var rpnStates = [];
      for (var i = 0; i < states.length; i++) {
        var state = states[i];
        var ruleResult = _.filter(rules, function(item) {
          return item.o === state.o.state && item.s === state.s.state && item.d === state.d.state;
        });
        var rState = ruleResult[0].r;
        state.rpn = rState;
        // 聚合状态种类
        if (rpnStates.indexOf(rState) === -1) {
          rpnStates.push(rState);
        }
      }
      callback(null, rpnStates, states);
    },
    function(rpnStates, states, callback) {
      var filterStates = [];
      for (var i = 0; i < rpnStates.length; i++) {
        var rpnState = rpnStates[i];
        // filter states  移除重复的
        var fStates = _.filter(states, function(item) {
          return item.rpn === rpnState;
        });
        // 得到最大值的情况
        var maxState = fStates[0];
        for (var j = 0; j < fStates.length; j++) {
          if (fStates[j].min > maxState.min) {
            maxState = null;
            maxState = fStates[j];
          }
        }
        // get scores
        var rpn = _.filter(RPN, function(item) {
          return item.state === rpnState;
        });
        maxState.scores = rpn[0].scores;
        filterStates.push(maxState);
      }
      callback(null, filterStates);
    },
    function(filterStates, callback) {
      // 计算结果
      var sumScores = 0;
      var sumMin = 0;
      for (var i = 0; i < filterStates.length; i++) {
        var fState = filterStates[i];
        sumScores += fState.min * fState.scores;
        sumMin += fState.min;
      }
      var fuzzyOutput = sumScores / sumMin;
      callback(null, fuzzyOutput);
    }
  ], function(err, result) {
    // console.log("输入结果：", result);
    // console.log(err,result)
    _cb(err, result);
  });
}


function generatorRules(callback) {
  //end_parsed will be emitted once parsing finished
  converter.on("end_parsed", function(rules) {
    //  console.log(rules); //here is your result jsonarray
    callback(null, rules);
  });
  //read from file
  require("fs").createReadStream("./rules.csv").pipe(converter);
}


//mulit test
function testRPNs() {
  async.waterfall([
    function(callback) {
      generatorRules(function(err, rules) {
        callback(null, rules);
      });
    },
    function(rules, callback) {
      // var ss = [2.86, 4.19, 3.73, 2.83, 2.83, 3.17, 3.17, 1.97, 5.10, 2.29, 4.54, 4.48, 4.19, 2.93, 1.15, 3.29, 1.55, 2.93, 2.89, 5.58, 5.79];
      // var os = [3.13, 4.69, 5.10, 3.95, 5.19, 3.68, 4.74, 2.99, 5.49, 2.70, 2.77, 4.38, 5.37, 3.06, 2.05, 5.10, 6.92, 6.15, 6.07, 6.00, 6.00];
      // var ds = [3.96, 4.28, 2.86, 2.40, 2.40, 2.27, 2.27, 1.72, 1.55, 1.89, 1.89, 2.43, 2.29, 5.88, 3.98, 5.49, 2.51, 2.89, 5.70, 5.58, 5.19];
      // var rpns = [4.07, 7, 5.29, 3.94, 4, 4.04, 4.34, 2.73, 5.62, 2.91, 4.91, 6, 6, 4.05, 2.41, 5.54, 2.71, 3.81, 4.91, 7, 7];
      var ss = [4.48,5.79,3.17,4.19,6,6.07,4.54,5.79,3.73,6.15,5.58,3.73,2.89,5.58,3.98,4.19];
      var os = [2.786518023,3.86636409,1.515716567,1.430969081,2.352158045,1.64375183,2.141127368,2.352158045,1.24573094,1.888175023,1.430969081,1.430969081,1.24573094,1.551845574,1.24573094,1.319507911];
      var ds = [3.96,2.43,2.29,2.41,5.7,5.88,2.89,2.7,2.29,5.62,5.49,2.86,1.72,3.96,2.51,1.89];
      // var rpns = [4.07, 7, 5.29, 3.94, 4, 4.04, 4.34, 2.73, 5.62, 2.91, 4.91, 6, 6, 4.05, 2.41, 5.54, 2.71, 3.81, 4.91, 7, 7];
      var mulitTestData = [];
      for (var len = 0; len < ss.length; len++) {
        mulitTestData.push({
          s: ss[len],
          o: os[len],
          d: ds[len]
          // rpn: rpns[len]
        });
      }

      async.each(mulitTestData, function(item, _callback) {
        analyzeOSD(memberShip(item.s), memberShip(item.o), memberShip(item.d), rules, function(err, result){
          var fixResult = Number(result).toFixed(2);
          // var fixInput = Number(item.rpn).toFixed(2);
          // console.log(fixResult, fixInput);
          // if (fixResult ===  fixInput) {
            // console.log("输入--> s: ", item.s," o: ", item.o," d: ", item.d, " rpn: ", item.rpn + "(保留两位小数:" + fixInput  +  ")", "输出结果: ", fixResult, "✅");
            console.log("输入--> s: ", item.s," o: ", item.o," d: ", item.d, "输出结果: ", fixResult, "✅");
            _callback();
          // }else{
          //   console.log("输入--> s: ", item.s," o: ", item.o," d: ", item.d, " rpn: ", item.rpn + "(保留两位小数:" + fixInput  +  ")", "输出结果: ", fixResult, "❌");
          //   _callback()
          // }
        });
      }, function(err) {
        callback(err)
      });
    }
  ], function(err, result) {
    console.log(err, result);
  });
}

testRPNs();

//test
// testData.forEach(function(item){
//   console.log("输入--> s: ", item.s," o: ", item.o," d: ", item.d);
//   analyzeOSD(memberShip(item.s), memberShip(item.o), memberShip(item.d));
// });

// 遍历数据osd －－》 更具funcs计算得出隶属度
// s: {state: "High", rate: 0.1}, {state: "mid", rate: 0.5}, o: {state: "low", rate: 0.3}, {state: "mid", rate: 0.4}, d: {state: "low", rate: 0.3}, {state: "mid", rate: 0.1}
//以上情况有八种情况出现
// 找出各种情况最低值
// s:high + o: low  + d: low = RPN mid
// s:high + o: mid  + d: low = RPN mid
// 遍历rules表，得到模糊的结果,在模糊的结果中找出相同结果的类型，得到隶属度最低值（情况中）的最大值（相同RPN结果）
// 模糊的RPN结果与其隶属度相乘/隶属度和，得出最后的RPN
