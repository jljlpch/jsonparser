# jsonparser
Parse the Javascript object with the help of provided path

#### Try Online
Try the json parser tool to test your own data at:

[http://jsonparser.mindinmotion.co](http://jsonparser.mindinmotion.co)

#Usage
1. Download the jsonparser module
2. Go to the lib (./lib) and add the downloaded module
3. require the module as below

   var parser = require('./lib/jsonparser')

Pass the JSON object and path to the function evaluate(arg1, arg2) as arg1 and arg2 respectively,

For example you can evaluate myPath on myObject as follow 
```json
var myObject = {
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
```
var myPath = "//students/subject"
 
var result = parse.evaluate(myObject, myPath)

result will be array of matching sub-object/property. Each matching sub-object/property will have two parts, one is "match" and second is "reference". "match" is the matching result of myPath on myObject and "reference" is the parent from which match is found.

result of parse.evaluate(myObject, myPath) is shown below 
```json
[
  {
    "match": [
      {
        "primary": "Math",
        "active": true
      }
    ],
    "reference": {
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
    }
  },
  {
    "match": [
      {
        "primary": "English",
        "active": true
      }
    ],
    "reference": {
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
    }
  },
  {
    "match": [
      {
        "primary": "English",
        "active": true
      },
      {
        "primary": "History",
        "active": false
      }
    ],
    "reference": {
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
    }
  }
]
```

similarly you can evaluate below expressions

```
'//students/subject'
'//students/subject[active == true]'
'//students[ city == concat("Chenn","ai")]/class'
'//students[ class == 12]'
'//students/subject[ primary == "English" ]/..'
'//students[ class == sum(5,2)]/name'
'//students[ class == max(5,2,10)]/name'
'//students[class == "7"]/teacher/Math'
```
#Utility
You can also evaluate multiple such myPath for multiple entities on a single JSON by using bulkEvaluate(arg1, agr2). For example, if your JSON contains multiple entities like Account, Address etc then you can use the template/bulkexpression.json, fill it and call the bulkEvaluate(arg1, arg2). An example has been provided in test/parsertest.js.

#Performance comparison - jsonparser/jsel
Performed test between jsel and json parser on the [object](/template/testObject.json). Test result has been shown below in the performance curve.
![ScreenShot](/template/graph.png)
###Test Result
Average time (on 20  object) is as follow

jsel  ~2277.20 ms  
json parer  ~8.9 ms 

