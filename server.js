var express = require("express");
const app = express()
const port = 11070
app.use(express.static(__dirname + '/public'))
app.listen(port)
