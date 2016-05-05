'use strict';
var _ = require('lodash');
var jsep = require('jsep');
var moment = require('moment');
var parser = require('./../index');

var self = {
    bulkEvaluate: function (obj, data, onlyone) {
        var returnObj = {
            "entities": []
        };
        var returnEntities = [];
        var cache = {};
        var entities = obj.entities;
        var count = 0;
        for (var i = 0; i < entities.length; i++) {
            var entity = {
                "entityName": ""
            };
            for (var key in entities[i]) {
                if (key == 'entityName') {
                    entity.entityName = entities[i][key];
                }
                else if (key == 'attributes') {
                    for (var atrkey in entities[i][key]) {
                        var res = parser.evaluate(data, entities[i][key][atrkey], cache, onlyone);
                        if (res.length != 0) {
                            count++;
                        }
                        if (onlyone) {
                            if (res.match) {
                                entity[atrkey] = res.match;
                            } else {
                                entity[atrkey] = res;
                            }
                        } else {
                            var matches = [];
                            for (var k = 0; k < res.length; k++) {
                                matches.push(res[k].match);
                            }
                            entity[atrkey] = matches;
                        }
                    }
                }
            }
            returnEntities.push(entity);
        }
        returnObj.entities = returnEntities;
        returnObj.count = count;
        return returnObj;
    }
};

module.exports = self;