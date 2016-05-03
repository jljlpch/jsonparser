# jsonparser
Parse the Javascript object with the help of provided path

#Usage
1. Download the jsonparser module
2. require the module as below

   var parser = require('parser')

Pass the JSON object and path to the evalaute(arg1, arg2) as arg1 and arg2 respectively,

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

similary you can evalaute below expressions 

```
'//students/subject'
'//students/subject[active == true]'
'//students[ city == concat("Chenn","ai")]/class'
'//students[ class == 12]'
'//students/subject[ primary == "English" ]/..'
'//students[ class == sum(5,2)]/name'
'//students[ class == max(5,2,10)]/name'
'//students[class == "7"]/teacher/Math'
'//students[class == "7"]/teacher/Math'
```
