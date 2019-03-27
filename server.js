const port = 3000;
const express = require('express')
const app = express()
var bodyParser = require('body-parser')
//Attach the middleware
app.use( bodyParser.json() );

app.post('/', function(request, response){
  var query1 = request.query.param1;
  var query2 = request.query.param2;

  console.log("Param1: ", query1);
  console.log("Param2: ", query2);
  const enrol = require('./enrolUser').enrolUser;
  try{
    enrol(query1, query2);
  }catch(err) {
    response.sendStatus(500).json({error: err.toString()});
  };  
  response.sendStatus(200);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
