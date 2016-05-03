'use strict';
var parser = require('./../jsonparser');
var parserutil = require('./../lib/parserutils');

var data = {
    "title": "School",
    "students": [
        {
            "name": "A",
            "class": "10",
            "city": "Mumbai",
            "subject": [
                {
                    "primary": "Math",
                    "active": true
                }
            ],
            "teacher": {
                "Math": "teacher M1",
                "English": "teacher E1"
            }
        },
        {
            "name": "B",
            "class": "9",
            "city": "Chennai",
            "subject": [
                {
                    "primary": "English",
                    "active": true
                }
            ],
            "teacher": {
                "Math": "teacher M2",
                "English": "teacher E2"
            }
        },
        {
            "name": "C",
            "class": "7",
            "city": "Chennai",
            "subject": [
                {
                    "primary": "English",
                    "active": true
                },
                {
                    "primary": "History",
                    "active": false
                }
            ],
            "teacher": {
                "Math": "teacher M3",
                "English": "teacher E3"
            }
        },
        {
            "name": "D",
            "class": "12"
        },
        {
            "name": "E",
            "class": "11"
        }
    ]
};

var bulkEntitiesExp = {
    "entities": [
        {
            "entityName": "School",
            "attributes": {
                "Subjects": "//students/subject"
            }
        }
    ]
};

var result = parserutil.bulkEvaluate(bulkEntitiesExp, data, true);

console.log('result is ' + JSON.stringify(result));