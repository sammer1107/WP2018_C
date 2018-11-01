var express = require("express");
const app = express()
const port = 11070
app.use(express.static(__dirname + '/public'))
app.use('/js', express.static(__dirname + '/js'))
app.use('/assets', express.static(__dirname + '/assets'))

app.listen(port)
