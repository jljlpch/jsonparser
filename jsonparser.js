'use strict';
var _ = require('lodash');
var jsep = require('jsep');
var moment = require('moment');

var self = {
    shorten: function (exp) {
        if (!(self.endsWith(exp, ']'))) {
            exp = exp.substring(0, exp.lastIndexOf('/'));
        }
        else {
            exp = exp.substring(0, exp.lastIndexOf('['));
        }
        return exp;
    },

    join: function (exp, part) {
        if ((self.endsWith(exp, '//'))) {
            exp = exp + part;
        } else {
            exp = exp + '/' + part;
        }
        return exp;
    },

    endsWith: function (str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    },

    startsWith: function (str, suffix) {
        var s = str.substring(0, suffix.length);
        return s.indexOf(suffix) !== -1;
    },

    splitString: function (str) {
        while (str.indexOf("#/") > -1) {
            str = str.replace('#/', "#");
        }
        str = str.split('/');

        for (var i = 0; i < str.length; i++) {
            str[i] = str[i].replace(/#/g, "/");
        }
        return str;
    },

    evaluate: function (data, exp, cache, onlyone) {
        var startFunc = false;
        var startExp = false;
        var spiltedExpLength = exp.split('/').length;
        var separatedElements = 0;
        var matchedLength = 0;
        var interData;
        var found = false;
        var expValue;
        var expPresent;
        var tempCache = {};
        var wholeExpMatch = false;
        var parent = false;
        var expPrnt;
        var newexp = exp;
        var starting = '//';
        var parse_exp;
        var matchedExpression;

        if (self.startsWith(exp, "//"))
            exp = '"' + exp + '"';
        parse_exp = jsep(exp);

        if (parse_exp.type == 'CallExpression') {
            exp = exp.split(parse_exp.callee.name + '(')[1];
            exp = exp.slice(0, -1);
            exp = exp.substring(1, exp.length - 1);
            startFunc = parse_exp.callee.name;
        } else {
            exp = exp.substring(1, exp.length - 1);
        }

        if (cache) {
            tempCache = cache;
        }
        while (separatedElements < spiltedExpLength - 2) {
            if (tempCache[newexp]) {
                if (separatedElements == 0) {
                    wholeExpMatch = true;
                }
                interData = tempCache[newexp];
                matchedLength = separatedElements;
                matchedExpression = newexp;
                found = true;
                break;
            }
            newexp = self.shorten(newexp);
            separatedElements++;
        }
        if (!wholeExpMatch) {
            var matches = [];
            var matchrecord = {"match": {}, "reference": {}};
            matchrecord.match = data;
            matches.push(matchrecord);
            if (interData == undefined) {
                interData = matches;
            }
            if (exp.indexOf('//') == 0) {
                expPrnt = exp;
                var dataArr = self.splitString(exp);
                var cntr;
                if (found) {
                    cntr = dataArr.length - matchedLength + 1;
                } else {
                    cntr = 2;
                }
                for (var i = cntr; i < dataArr.length; i++) {
                    var lastBackElement = false;
                    if (dataArr[i] == '..') {
                        var expForParent = expPrnt;
                        var backCount = 0;
                        parent = true;
                        expForParent = starting;
                        do {
                            if (backCount > 0) {
                                expForParent = expForParent.substring(0, n);
                            }
                            backCount++;
                            var n = expForParent.lastIndexOf('/');
                            var temp = expForParent.substring(0, n);
                            var result = expForParent.substring(n + 1);
                            if (result.indexOf('[') > -1) {
                                var m = result.lastIndexOf('[');
                                var resultNoExp = result.substring(0, m);

                                expForParent = temp + '/' + resultNoExp;
                            } else {
                                expForParent = temp + '/' + result;
                            }
                        } while (result == '..');

                        if (backCount > 1) {
                            for (var g = 1; g < backCount; g++) {
                                var n = expForParent.lastIndexOf('/');
                                var result = expForParent.substring(n + 1);
                                if (result.indexOf('[') > -1) {
                                    var m = result.lastIndexOf('[');
                                    var resultNoExp = result.substring(0, m);
                                    lastBackElement = resultNoExp;
                                } else {
                                    lastBackElement = result;
                                }
                                expForParent = expForParent.substring(0, n);
                            }
                        }
                        //find match
                        var beforeMatch;
                        var toMatchPath;
                        beforeMatch = tempCache[expForParent];
                        if (backCount > 1) {
                            toMatchPath = starting;
                        } else {
                            toMatchPath = starting;
                        }
                        var toMatch = tempCache[toMatchPath];
                        var matches = [];
                        for (var x = 0; x < beforeMatch.length; x++) {
                            if (_.isArray(beforeMatch[x].match)) {
                                for (var j = 0; j < beforeMatch[x].match.length; j++) {
                                    for (var t = 0; t < toMatch.length; t++) {
                                        var collectMatch;
                                        if (_.isArray(toMatch[t].match)) {
                                            collectMatch = [];
                                            for (var s = 0; s < toMatch[t].match.length; s++) {
                                                collectMatch.push(toMatch[t].match[s]);
                                            }
                                        } else {
                                            collectMatch = toMatch[t].match;
                                        }
                                        var matchrecord = false;
                                        if (lastBackElement) {
                                            var dm = {};
                                            dm[lastBackElement] = collectMatch;
                                        } else {
                                            var dm = collectMatch
                                        }
                                        if (_.isMatch(beforeMatch[x].match[j], dm)) {
                                            if (!(matches.indexOf(beforeMatch[x]) > -1)) {
                                                matchrecord = beforeMatch[x];
                                                matches.push(matchrecord);
                                            }
                                        }
                                    }
                                }
                            } else {
                                for (var p = 0; p < toMatch.length; p++) {
                                    var matchrecord = false;
                                    var dm = {};
                                    dm[lastBackElement] = toMatch[p].match;
                                    if (_.isMatch(beforeMatch[x].match, dm)) {
                                        if (!(matches.indexOf(beforeMatch[x]) > -1)) {
                                            matchrecord = beforeMatch[x];
                                            matches.push(matchrecord);
                                        }
                                    }
                                }
                            }

                        }
                        starting = self.join(starting, dataArr[i]);
                        tempCache[starting] = matches;
                        interData = matches;
                        continue;
                    }
                    if ((dataArr[i].indexOf("[") > -1)) {
                        expPresent = true;
                        expValue = dataArr[i].split('[')[1];
                        expValue = '[' + expValue;
                        dataArr[i] = dataArr[i].substring(0, dataArr[i].indexOf('['));
                    }
                    var matchesLen = interData.length;
                    matches = [];
                    for (var k = 0; k < matchesLen; k++) {
                        if (dataArr[i] == '') {
                            matchrecord = {"match": {}, "reference": {}};
                            matchrecord.match = data;
                            matchrecord.reference = data;
                            matches.push(matchrecord);
                        } else {
                            if (interData[k].match[dataArr[i]]) {
                                matchrecord = {"match": {}, "reference": {}};
                                matchrecord.match = interData[k].match[dataArr[i]];
                                matchrecord.reference = interData[k].match;
                                matches.push(matchrecord);
                            } else if (_.isArray(interData[k].match)) {
                                for (var j = 0; j < interData[k].match.length; j++) {
                                    matchrecord = {"match": {}, "reference": {}};
                                    if (interData[k].match[j][dataArr[i]] && _.isObject(interData[k].match[j][dataArr[i]])) {
                                        matchrecord.match = interData[k].match[j][dataArr[i]];
                                        matchrecord.reference = interData[k].match[j];
                                        matches.push(matchrecord);
                                    }
                                    else if (interData[k].match[j][dataArr[i]]) {
                                        matchrecord.match = interData[k].match[j][dataArr[i]];
                                        matchrecord.reference = interData[k].match[j];
                                        matches.push(matchrecord);
                                    }
                                }
                            }
                            else if (_.isObject(interData[k].match) && interData[k].match[dataArr[i]]) {
                                matchrecord = {"match": {}, "reference": {}};
                                matchrecord.match = interData[k].match[dataArr[i]];
                                matchrecord.reference = interData[k].match;
                                matches.push(matchrecord);
                            }
                        }

                    }
                    interData = matches;
                    if (found) {
                        starting = self.join(matchedExpression, dataArr[i]);
                        found = false;
                    } else {
                        starting = self.join(starting, dataArr[i]);
                    }

                    if (!tempCache[starting]) {
                        tempCache[starting] = matches;
                    }

                    if (expPresent && _.isArray(interData)) {
                        var parentMatches = [];
                        for (var kk = 0; kk < interData.length; kk++) {
                            var nn = self.evaluateExp(expValue, interData[kk].match);
                            for (var jj = 0; jj < nn.length; jj++) {
                                var parentMatch = {"match": {}, "reference": {}};
                                parentMatch.match = nn[jj];
                                parentMatch.reference = interData[kk].match;
                                parentMatches.push(parentMatch);
                            }
                        }
                        interData = parentMatches;
                        matches = parentMatches;
                        starting = starting + expValue;
                        if (i == 2) {
                            if (!tempCache[starting]) {
                                tempCache[starting] = matches;
                            }
                        }
                        else {
                            if (!tempCache[starting]) {
                                tempCache[starting] = matches;
                            }
                        }
                        expPresent = false;
                        startExp = false;
                    }
                    if (parent) {
                        matches = interData;
                        parent = false;
                    }
                }
                if (startFunc) {
                    matches = self[startFunc](matches);
                    if (!onlyone) {
                        return matches;
                    } else if (onlyone && matches[0]) {
                        return matches[0];
                    } else {
                        return matches;
                    }
                } else if (!onlyone) {
                    return matches;
                } else if (onlyone && matches[0]) {
                    return matches[0];
                } else {
                    return matches;
                }
            } else {
                console.log('Expression is incorrect, expected // in the beginning ..')
            }
        } else {
            if (!onlyone) {
                return interData;
            } else if (onlyone && interData[0]) {
                return interData[0];
            } else {
                return interData;
            }
        }
    },

    evaluateExp: function (exp, data) {
        var parse_tree = jsep(exp);
        var d = false;
        var result = [];
        for (var i = 0; i < data.length; i++) {
            d = data[i];
            if (parse_tree.elements[0].callee) {
                if (expressionTree(false, false, d, false, parse_tree.elements[0].arguments[0].type, parse_tree.elements[0].arguments, parse_tree.elements[0].callee)) {
                    result.push(d)
                }
            } else {
                if (expressionTree(parse_tree.elements[0].left, parse_tree.elements[0].right, d, parse_tree.elements[0].operator, parse_tree.elements[0].type, false, false)) {
                    result.push(d)
                }
            }
        }
        return result;

        function expressionTree(left, right, input, operator, type, args, callee) {
            var func;
            var tempR, tempL, temp, tempArgumentR, tempArgument, tempArgumentL, argumentsTemp = [];
            argumentsTemp.push({});
            if (callee) {
                if (args.length == 0) {
                    func = 'CallExpressionEva';
                    return self[func](args, callee, input);
                } else if (args[0].left && args[0].right) {
                    tempArgument = {};
                    argumentsTemp[0].type = "Literal";
                    argumentsTemp[0].value = expressionTree(args[0].left, args[0].right, input, args[0].operator, args[0].type);
                    func = 'CallExpressionEva';
                    return self[func](argumentsTemp, callee, input);

                } else if (args[0].arguments) {
                    console.log('not expected case ');

                } else if (!args[0].left && !args[0].right && !args[0].arguments && args.length == 1) {
                    func = 'CallExpressionEva';
                    return self[func](args, callee, input);

                } else if (args.length > 1) {
                    func = 'CallExpressionEva';
                    return self[func](args, callee, input);
                }
            }
            else {
                if (right.left && left.right) {
                    tempR = {};
                    tempR.type = "Literal";
                    tempR.value = expressionTree(right.left, right.right, input, right.operator, right.type);
                    tempL = {};
                    tempL.type = "Literal";
                    tempL.value = expressionTree(left.left, left.right, input, left.operator, left.type);
                    func = type + 'Eva';
                    return self[func](tempL, tempR, input, operator);

                    //return expressionTree (right.left, right.right, input)
                } else if (right.left && left.arguments) {
                    tempR = {};
                    tempR.type = "Literal";
                    tempR.value = expressionTree(right.left, right.right, input, right.operator, right.type);
                    tempL = {};
                    tempL.type = "Literal";
                    tempL.value = expressionTree(false, false, input, false, false, left.arguments, left.callee);
                    func = type + 'Eva';
                    return self[func](tempL, tempR, input, operator);
                } else if (right.left && (!left.arguments && !left.right)) {
                    temp = {};
                    temp.type = "Literal";
                    temp.value = expressionTree(right.left, right.right, input, right.operator, right.type);
                    func = type + 'Eva';
                    return self[func](left, temp, input, operator);
                }
                else if (right.arguments && left.right) {
                    tempR = {};
                    tempR.type = "Literal";
                    tempR.value = expressionTree(false, false, input, false, false, right.arguments, right.callee);
                    tempL = {};
                    tempL.type = "Literal";
                    tempL.value = expressionTree(left.left, left.right, input, left.operator, left.type);
                    func = type + 'Eva';
                    return self[func](tempL, tempR, input, operator);
                }
                else if (right.arguments && left.arguments) {
                    tempR = {};
                    tempR.type = "Literal";
                    tempR.value = expressionTree(false, false, input, false, false, right.arguments, right.callee);
                    tempL = {};
                    tempL.type = "Literal";
                    tempL.value = expressionTree(false, false, input, false, false, left.arguments, left.callee);
                    func = type + 'Eva';
                    return self[func](tempL, tempR, input, operator);
                } else if (right.arguments && (!left.right && !left.arguments)) {
                    temp = {};
                    temp.type = "Literal";
                    temp.value = expressionTree(false, false, input, false, right.type, right.arguments, right.callee);
                    func = type + 'Eva';
                    return self[func](left, temp, input, operator);
                }
                else if ((!right.left && !right.arguments) && left.right) {
                    temp = {};
                    temp.type = "Literal";
                    temp.value = expressionTree(left.left, left.right, input, left.operator, left.type);
                    func = type + 'Eva';
                    return self[func](temp, right, input, operator);
                } else if ((!right.left && !right.arguments) && left.arguments) {
                    temp = {};
                    temp.type = "Literal";
                    temp.value = expressionTree(false, false, input, false, false, left.arguments, left.callee);
                    func = type + 'Eva';
                    return self[func](temp, right, input, operator);
                } else if ((!right.left && !right.arguments) && (!left.right && !left.arguments)) {
                    func = type + 'Eva';
                    return self[func](left, right, input, operator);
                } else if (!right.left && left.right) {
                    temp = {};
                    temp.type = "Literal";
                    temp.value = expressionTree(left.left, left.right, input, left.operator, left.type);
                    func = type + 'Eva';
                    return self[func](temp, right, input, operator);
                }
                else if (!right.left && !left.left) {
                    func = type + 'Eva';
                    return self[func](left, right, input, operator);
                }
            }
        }
    },

    boolean: function (match) {
        var matches = [];
        var matchrecord = {"match": {}, "reference": {}};

        if (match.length == 0) {
            matchrecord.match = 'false';
            matches.push(matchrecord);
            return matches;
        } else if (typeof(match[0].match) == 'boolean') {
            matchrecord.match = match[0].match;
            matches.push(matchrecord);
            return matches;
        } else if (match[0].match) {
            if (match[0].match == 'true') {
                matchrecord.match = 'true';
            } else if (match[0].match == 'false') {
                matchrecord.match = 'false';
            } else {
                matchrecord.match = 'true';
            }
            matches.push(matchrecord);
            return matches;
        } else {
            matchrecord.match = 'false';
            matches.push(matchrecord);
            return matches;
        }

    },

    match: function (match) {
        var matches = [];
        var matchrecord = {"match": {}, "reference": {}};
        if (match[0].match.length == 0) {
            matchrecord.match = false;
            matches.push(matchrecord);
            return matches;
        }
        else
            matchrecord.match = true;
        matches.push(matchrecord);
        return matches;
    },

    not: function (match) {
        var matches = [];
        var matchrecord = {"match": {}, "reference": {}};
        if (match[0] == undefined) {
            matchrecord.match = true;
            matches.push(matchrecord);
            return matches;
        }
        else if (match[0].match.length == 0) {
            matchrecord.match = true;
            matches.push(matchrecord);
            return matches;
        } else if (match[0].match == true) {
            matchrecord.match = false;
            matches.push(matchrecord);
            return matches;
        } else if (match[0].match == false) {
            matchrecord.match = true;
            matches.push(matchrecord);
            return matches;
        } else {
            matchrecord.match = false;
            matches.push(matchrecord);
            return matches;
        }
    },

    BinaryExpressionEva: function (left, right, input, operator) {
        switch (operator) {
            case '==':
                if (left.type == 'Identifier' && right.type == 'Identifier') {
                    if (input[left.name] == input[right.name]) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (left.type == 'Identifier' && right.type == 'Literal') {
                    if (input[left.name] == right.value) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (left.type == 'Literal' && right.type == 'Literal') {
                    if (left.value == right.value) {
                        return true;
                    } else {
                        return false;
                    }
                }
                break;
            case '+':
                if (left.type == 'Identifier' && right.type == 'Identifier') {
                    return (parseInt(input[left.name]) + parseInt(input[right.name]));
                } else if (left.type == 'Identifier' && right.type == 'Literal') {
                    return (parseInt(input[left.name]) + right.value);
                } else if (left.type == 'Literal' && right.type == 'Literal') {
                    return (left.value + right.value);
                }
                break;
            case '-':
                if (left.type == 'Identifier' && right.type == 'Identifier') {
                    return (parseInt(input[left.name]) - parseInt(input[right.name]));
                } else if (left.type == 'Identifier' && right.type == 'Literal') {
                    return (parseInt(input[left.name]) - right.value);
                } else if (left.type == 'Literal' && right.type == 'Literal') {
                    return (left.value - right.value);
                }
                break;
            case '*':
                if (left.type == 'Identifier' && right.type == 'Identifier') {
                    return (parseInt(input[left.name]) * parseInt(input[right.name]));
                } else if (left.type == 'Identifier' && right.type == 'Literal') {
                    return (parseInt(input[left.name]) * right.value);
                } else if (left.type == 'Literal' && right.type == 'Literal') {
                    return (left.value * right.value);
                }
                break;
            case '/':
                if (left.type == 'Identifier' && right.type == 'Identifier') {
                    return (left.value / right.value);
                } else if (left.type == 'Identifier' && right.type == 'Literal') {
                    return (left.value / right.value);
                } else if (left.type == 'Literal' && right.type == 'Literal') {
                    return (left.value / right.value);
                }
                break;
            case '!=':
                if (left.type == 'Identifier' && right.type == 'Identifier') {
                    if (input[left.name] != input[right.name]) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (left.type == 'Identifier' && right.type == 'Literal') {
                    if (input[left.name] != right.value) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (left.type == 'Literal' && right.type == 'Literal') {
                    if (left.value != right.value) {
                        return true;
                    } else {
                        return false;
                    }
                }
                break;
            case '>=':
                if (left.type == 'Identifier' && right.type == 'Identifier') {
                    if (input[left.name] >= input[right.name]) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (left.type == 'Identifier' && right.type == 'Literal') {
                    if (input[left.name] >= right.value) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (left.type == 'Literal' && right.type == 'Literal') {
                    if (left.value >= right.value) {
                        return true;
                    } else {
                        return false;
                    }
                }
                break;
            case '<=':
                if (left.type == 'Identifier' && right.type == 'Identifier') {
                    if (input[left.name] <= input[right.name]) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (left.type == 'Identifier' && right.type == 'Literal') {
                    if (input[left.name] <= right.value) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (left.type == 'Literal' && right.type == 'Literal') {
                    if (left.value <= right.value) {
                        return true;
                    } else {
                        return false;
                    }
                }
                break;
        }
    },

    LogicalExpressionEva: function (left, right, input, operator) {
        switch (operator) {
            case '&&':
                if (left.type == 'Literal' && right.type == 'Literal') {
                    if (left.value && right.value) {
                        return true;
                    } else {
                        return false;
                    }
                }
                break;
            case '||':
                if (left.type == 'Literal' && right.type == 'Literal') {
                    if (left.value || right.value) {
                        return true;
                    } else {
                        return false;
                    }
                }
                break;
        }
    },

    CallExpressionEva: function (args, callee, input) {
        switch (callee.name) {
            case 'not':
                if (args[0].type == 'Identifier') {
                    return !(input[args[0].name])
                }
                else {
                    return !args[0].value;
                }
                break;
            case 'lowercase':
                if (args[0].type == 'Identifier') {
                    return (input[args[0].name]).toLowerCase();
                }
                else {
                    return args.toLowerCase();
                }
                break;
            case 'uppercase':
                if (args[0].type == 'Identifier') {
                    return (input[args[0].name]).toUpperCase();
                }
                else {
                    return argumentsValue.toUpperCase();
                }
                break;
            case 'floor':
                if (args[0].type == 'Identifier') {
                    return Math.floor(input[args[0].name]);
                }
                else {
                    return Math.floor(args[0].value);
                }
                break;
            case 'abs':
                if (args[0].type == 'Identifier') {
                    return Math.abs(input[args[0].name]);
                }
                else if (!args[0].argument && args[0].type == 'Literal') {
                    return Math.abs(args[0].value);
                } else if (args[0].argument.type == 'Identifier') {
                    return Math.abs(input[args[0].argument.name]);
                } else {
                    return Math.abs([args[0].argument.value]);
                }
                break;
            case 'round':
                if (args[0].type == 'Identifier') {
                    return Math.round(input[args[0].name]);
                }
                else {
                    return Math.round(args[0].value);
                }
                break;
            case 'ceiling':
                if (args[0].type == 'Identifier') {
                    return Math.ceil(input[args[0].name]);
                }
                else {
                    return Math.ceil(args[0].value);
                }
                break;
            case 'substring':
                arr = [];
                if (args.length == 2) {
                    for (var i = 0; i < args.length; i++) {
                        if (args[i].type == 'Identifier') {
                            arr.push(input[args[i].name]);
                        } else if (args[i].type == 'Literal') {
                            arr.push(args[i].value);
                        }
                    }
                    return (arr[0]).substring(arr[1]);
                }
                if (args.length == 3) {
                    for (var i = 0; i < args.length; i++) {
                        if (args[i].type == 'Identifier') {
                            arr.push(input[args[i].name]);
                        } else if (args[i].type == 'Literal') {
                            arr.push(args[i].value);
                        }
                    }
                    return (arr[0]).substring(arr[1], arr[2]);
                }
                break;
            case 'concat':
                var r = '';
                for (var i = 0; i < args.length; i++) {
                    if (args[0].type == 'Identifier') {
                        r = r.concat(input[args[i].name]);
                    }
                    else {
                        r = r.concat(args[i].value);
                    }
                }
                return r;
                break;
            case 'contains':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return arr[0].indexOf(arr[1]) > -1;
                break;
            case 'startsWith':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return arr[0].startsWith(arr[1]);
                break;
            case 'endsWith':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return arr[0].endsWith(arr[1]);
                break;
            case 'substringBefore':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return arr[0].substring(0, arr[0].indexOf(arr[1]));
                break;
            case 'substringAfter':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                // var rr = str.split('ai')[1];
                return arr[0].split(arr[1])[1];
                break;
            case 'replace':
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                //var res = str.replace("to", "for");
                return arr[0].replace(arr[1], arr[2]);
                break;
            case 'stringLength':
                if (args[0].type == 'Identifier') {
                    return (input[args[0].name]).length;
                }
                else {
                    return (args[0].value).length;
                }
                break;
            case 'numericSubtract':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return (arr[0] - arr[1]);
                break;
            case 'numericAdd':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return (arr[0] + arr[1]);
                break;
            case 'numericMultiply':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return (arr[0] * arr[1]);
                break;
            case 'numericDivide':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return (arr[0] / arr[1]);
                break;
            case 'numericIntegerDivide':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return Math.floor(arr[0] / arr[1]);
                break;
            case 'numericMod':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return (arr[0] % arr[1]);
                break;
            case 'numericUnaryPlus':
                if (args[0].type == 'Identifier') {
                    return input[args[0].name];
                } else if (args[0].type == 'Literal') {
                    return args[0].value;
                }
                break;
            case 'numericUnaryMinus':
                if (args[0].type == 'Identifier') {
                    return -(input[args[0].name]);
                }
                else if (!args[0].argument && args[0].type == 'Literal') {
                    return -(args[0].value);
                } else if (args[0].argument.type == 'Identifier') {
                    return -(input[args[0].argument.name]);
                } else {
                    return ([args[0].argument.value]);
                }
                break;
            case 'numericEqual':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return (arr[0] == arr[1]);
                break;
            case 'numericLessThan':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return (arr[0] < arr[1]);
                break;
            case 'numericGreaterThan':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return (arr[0] > arr[1]);
                break;
            case 'yearsFromDuration':
                var d;
                if (args[0].type == 'Identifier') {
                    d = new Date(input[args[0].name]);
                    return d.getFullYear();
                }
                else {
                    d = new Date(args[0].value);
                    return d.getFullYear();
                }
                break;
            case 'monthsFromDuration':
                var d;
                if (args[0].type == 'Identifier') {
                    d = new Date(input[args[0].name]);
                    return d.getMonth();
                }
                else {
                    d = new Date(args[0].value);
                    return d.getMonth();
                }
                break;
            case 'daysFromDuration':
                var d;
                if (args[0].type == 'Identifier') {
                    d = new Date(input[args[0].name]);
                    return d.getDay();
                }
                else {
                    d = new Date(args[0].value);
                    return d.getDay();
                }
                break;
            case 'hoursFromDuration':
                var d;
                if (args[0].type == 'Identifier') {
                    d = new Date(input[args[0].name]);
                    return d.getHours();
                }
                else {
                    d = new Date(args[0].value);
                    return d.getHours();
                }
                break;
            case 'minutesFromDuration':
                var d;
                if (args[0].type == 'Identifier') {
                    d = new Date(input[args[0].name]);
                    return d.getMinutes();
                }
                else {
                    d = new Date(args[0].value);
                    return d.getMinutes();
                }
                break;
            case 'secondsFromDuration':
                var d;
                if (args[0].type == 'Identifier') {
                    d = new Date(input[args[0].name]);
                    return d.getSeconds();
                }
                else {
                    d = new Date(args[0].value);
                    return d.getSeconds();
                }
                break;
            case 'hoursFromTime':
                var d;
                if (args[0].type == 'Identifier') {
                    d = input[args[0].name].split(':')
                    return d[0];
                }
                else {
                    d = args[0].value.split(':')
                    return d[0];
                }
                break;
            case 'minutesFromTime':
                var d;
                if (args[0].type == 'Identifier') {
                    d = input[args[0].name].split(':')
                    return d[1];
                }
                else {
                    d = args[0].value.split(':')
                    return d[1];
                }
                break;
            case 'secondsFromTime':
                var d;
                if (args[0].type == 'Identifier') {
                    d = input[args[0].name].split(':')
                    return d[2];
                }
                else {
                    d = args[0].value.split(':')
                    return d[2];
                }
                break;
            case 'boolean':
                if (args[0].type == 'Identifier') {
                    if (!input[args[0].name]) {
                        return false;
                    }
                    else if (typeof(input[args[0].name]) == 'boolean') {
                        return input[args[0].name];
                    } else if (input[args[0].name] == 'true') {
                        return true;
                    } else if (input[args[0].name] == 'false') {
                        return false
                    } else {
                        return true;
                    }
                }
                else if (args[0].type == 'Literal') {
                    if (args[0].value == 'true') {
                        return true;
                    } else if (args[0] == 'false') {
                        return false
                    } else {
                        return true;
                    }
                }
                break;
            case 'stringJoin':
                var seprator;
                arr = [];
                if (args[0].type == 'Identifier') {
                    seprator = input[args[i].name]
                } else if (args[0].type == 'Literal') {
                    seprator = args[0].value;
                }
                for (var i = 1; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return arr.join(seprator);
                break;
            case 'dateTimeEqual':
                var d1, d2;
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                d1 = moment(arr[0]).unix();
                d2 = moment(arr[1]).unix();
                if (d1 == d2)
                    return true;
                else
                    return false;
                break;
            case 'dateTimeLessThan':
                var d1, d2;
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                d1 = moment(arr[0]).unix();
                d2 = moment(arr[1]).unix();
                if (d1 < d2)
                    return true;
                else
                    return false;
                break;
            case 'dateTimeGreaterThan':
                var arr = [];
                var d1, d2;
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                d1 = moment(arr[0]).unix();
                d2 = moment(arr[1]).unix();
                if (d1 > d2)
                    return true;
                else
                    return false;
                break;
            case 'timeEqual':
                var d = [];
                var d2 = [];
                var tz;
                var hhmm = [];
                var sign;
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        d.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        d.push(args[i].value);
                    }
                }
                for (var i = 0; i < d.length; i++) {
                    if (d[i].indexOf('+') > -1) {
                        tz = true;
                        sign = 'plus';
                        d[i] = d[i].split('+');
                        hhmm = d[i][1].split(':');
                        hhmm[0] = -hhmm[0];
                        hhmm[2] = -hhmm[1];
                    } else if (d[i].indexOf('-') > -1) {
                        tz = true;
                        sign = 'minus';
                        d[i] = d[i].split('-');
                        hhmm = d[i][1].split(':');
                    }
                    if (tz) {
                        d[i] = moment(d[i][0], "HH:mm:ss").add(hhmm[0], 'hours').add(hhmm[1], 'minutes').unix();
                        d2.push(d[i])
                    } else {
                        d[i] = moment(d[i], "HH:mm:ss").unix();
                        d2.push(d[i]);
                    }
                }
                if (d2[0] == d2[1])
                    return true;
                else
                    return false;
                break;
            case 'timeLessThan':
                var d = [];
                var d2 = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        d.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        d.push(args[i].value);
                    }
                }
                for (var i = 0; i < d.length; i++) {
                    if (d[i].indexOf('+') > -1) {
                        tz = true;
                        sign = 'plus';
                        d[i] = d[i].split('+');
                        hhmm = d[i][1].split(':');
                        hhmm[0] = -hhmm[0];
                        hhmm[2] = -hhmm[1];
                    } else if (d[i].indexOf('-') > -1) {
                        tz = true;
                        sign = 'minus';
                        d[i] = d[i].split('-');
                        hhmm = d[i][1].split(':');
                    }
                    if (tz) {
                        d[i] = moment(d[i][0], "HH:mm:ss").add(hhmm[0], 'hours').add(hhmm[1], 'minutes').unix();
                        d2.push(d[i])
                    } else {
                        d[i] = moment(d[i], "HH:mm:ss").unix();
                        d2.push(d[i]);
                    }
                }
                if (d2[0] < d2[1])
                    return true;
                else
                    return false;
                break;
            case 'timeGreaterThan':
                var d = [];
                var d2 = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        d.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        d.push(args[i].value);
                    }
                }

                for (var i = 0; i < d.length; i++) {
                    if (d[i].indexOf('+') > -1) {
                        tz = true;
                        sign = 'plus';
                        d[i] = d[i].split('+');
                        hhmm = d[i][1].split(':');
                        hhmm[0] = -hhmm[0];
                        hhmm[2] = -hhmm[1];
                    } else if (d[i].indexOf('-') > -1) {
                        tz = true;
                        sign = 'minus';
                        d[i] = d[i].split('-');
                        hhmm = d[i][1].split(':');
                    }
                    if (tz) {
                        d[i] = moment(d[i][0], "HH:mm:ss").add(hhmm[0], 'hours').add(hhmm[1], 'minutes').unix();
                        d2.push(d[i])
                    } else {
                        d[i] = moment(d[i], "HH:mm:ss").unix();
                        d2.push(d[i]);
                    }
                }
                if (d2[0] > d2[1])
                    return true;
                else
                    return false;
                break;
            case 'booleanEqual':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr[0] == arr[1])
                    return true;
                else
                    return false;
                break;
            case 'booleanLessThan':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr[0] == false && arr[1] == true)
                    return true;
                else if (arr[0] == true && arr[1] == false)
                    return false;
                break;
            case 'booleanGreaterThan':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr[0] == true && arr[1] == false)
                    return true;
                else if (arr[0] == false && arr[1] == true)
                    return false;
                break;
            case 'indexOf':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                var index = arr[arr.length - 1];
                arr.pop();
                var indexes = [];
                i = -1;
                while ((i = arr.indexOf(index, i + 1)) != -1) {
                    indexes.push(i);
                }
                return indexes;
                break;
            case 'distinctValues':
                var arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                Array.prototype.contains = function (v) {
                    for (var i = 0; i < this.length; i++) {
                        if (this[i] === v) return true;
                    }
                    return false;
                };

                Array.prototype.unique = function () {
                    var arr = [];
                    for (var i = 0; i < this.length; i++) {
                        if (!arr.contains(this[i])) {
                            arr.push(this[i]);
                        }
                    }
                    return arr;
                };
                arr = arr.unique();
                return arr;
                break;
            case 'insertBefore':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                var pos = arr[arr.length - 2];
                var insert = arr[arr.length - 1];
                arr.pop();
                arr.pop();
                arr.splice(pos, 0, insert);
                return arr;
                break;
            case 'count':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                return arr.length;
                break;
            case 'avg':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                var sum = 0, average, length;
                length = arr.length;
                for (var i = 0; i < arr.length; i++) {
                    sum = sum + arr[i];
                }
                average = sum / length;
                return average;
                break;
            case 'max':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                var max = arr[0];
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] > max)
                        max = arr[i];
                }
                return max;
                break;
            case 'min':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                var min = arr[0];
                for (var i = 0; i < arr.length; i++) {
                    if (arr[i] < min)
                        min = arr[i];
                }
                return min;
                break;
            case 'sum':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                var sum = 0;
                for (var i = 0; i < arr.length; i++) {
                    sum = sum + arr[i];
                }
                return sum;
                break;
            case 'currentDateTime':
                var cdt = moment().toDate();
                return cdt
                break;
            case 'currentDate':
                var t = moment().format("YYYY-MM-DD Z");
                return t;
                break;
            case 'currentTime':
                var t = moment().format("HH:mm Z");
                return t;
                break;
            case 'to':
                arr = [];
                var seq = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr[0] <= arr[1]) {
                    while (arr[0] <= arr[1]) {
                        seq.push(arr[0]);
                        arr[0] = arr[0] + 1;
                    }
                }
                break;
            case 'reverse':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                arr.reverse();
                break;
            case 'zeroOrOne':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr.length == 0 || arr.length == 1)
                    return arr;
                else return false;
                break;
            case 'oneOrMore':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr.length >= 1)
                    return arr;
                else return false;
                break;
            case 'exactlyOne':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr.length == 1)
                    return arr;
                else
                    return false;
                break;
            case 'empty':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr.length == 0)
                    return true;
                else
                    return false;
                break;
            case 'exists':
                arr = [];
                for (var i = 0; i < args.length; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                if (arr.length > 0)
                    return true;
                else
                    return false;
                break;
            case 'remove':
                arr = [];
                for (var i = 0; i < args.length - 1; i++) {
                    if (args[i].type == 'Identifier') {
                        arr.push(input[args[i].name]);
                    } else if (args[i].type == 'Literal') {
                        arr.push(args[i].value);
                    }
                }
                arr.splice(1, 1);
                break;
            case 'floor':
                if (args[0].type == 'Identifier') {
                    return Math.floor(input[args[0].name]);
                }
                else {
                    return Math.floor(argumentsValue);
                }
                break;
            case 'floor':
                if (args[0].type == 'Identifier') {
                    return Math.floor(input[args[0].name]);
                }
                else {
                    return Math.floor(argumentsValue);
                }
                break;
        }
    }
};

module.exports = self;
