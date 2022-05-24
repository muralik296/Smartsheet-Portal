//Using dotenv
require("dotenv").config();


const express = require("express");
//Using the app express
const app = express();


const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");


const isLoggedIn = require("./middleware/auth");


const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const {
  nextTick
} = require("process");
const { info } = require("console");


//EJS
app.set("view engine", "ejs");

//Cookieparser middleware
app.use(cookieParser());


//Initialize bodyparser middleware
app.use(bodyParser.urlencoded({
  limit: '50mb',
  extended: true
}));
app.use(express.static("public"));

app.use(isLoggedIn());



//----- Routing -------
app.use("/",require("./Routes/authenticate"));
app.use("/",require("./Routes/admin"));
app.use("/",require("./Routes/home"));
app.use("/",require("./Routes/quote-previewer"));
app.use("/",require("./Routes/project-lifecycle"));


//----- -404 Error- -----
//Middleware 404 page handler
app.use(function(req, res) {
  res.status(404).render("404");
})


let port = process.env.PORT;
let host = process.env.HOST;

app.listen(port, host, function(req, res) {
  console.log(`Server is running at ${host}:${port}`);
});
