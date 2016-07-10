'use strict'

var _ = require("lodash");

module.exports = function fuzzyFema(options) {
  options = options || {}
    // test data
  var self = this;
  // get val is or not in arr,eq: [2,8], 3 --> true
  this.isInRange = function(arr, val) {
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
  this.memberShip = function(val) {
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
        x: 1 / 2,
        b: -1
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
      state: "Very High"
    }, ];
    var memberShips = [];
    for (var i = 0; i < funcs.length; i++) {
      var item = funcs[i];
      if (self.isInRange(item.range, val)) {
        var rate = item.formula.x * val + item.formula.b;
        memberShips.push({
          state: item.state,
          rate: rate
        })
      }
    }
    return memberShips;
  }


  // 遍历数据osd －－》 更具funcs计算得出隶属度
  // s: {state: "High", rate: 0.1}, {state: "mid", rate: 0.5}, o: {state: "low", rate: 0.3}, {state: "mid", rate: 0.4}, d: {state: "low", rate: 0.3}, {state: "mid", rate: 0.1}
  //以上情况有八种情况出现
  // 找出各种情况最低值
  // s:high + o: low  + d: low = RPN mid
  // s:high + o: mid  + d: low = RPN mid
  // 遍历rules表，得到模糊的结果,在模糊的结果中找出相同结果的类型，得到隶属度最低值（情况中）的最大值（相同RPN结果）
  // 模糊的RPN结果与其隶属度相乘/隶属度和，得出最后的RPN


  return true
}
