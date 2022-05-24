const express = require("express");
const router = express.Router();

//Smartsheet Client
const client = require("smartsheet");

//Get the home page
router.get("/", function(req, res) {

    client.createClient({accessToken:res.locals.apiKey,logLevel:'info'}).users.getCurrentUser()
    .then(function(userProfile) {
      const username = userProfile.firstName+" "+userProfile.lastName;
      console.log('USER LOGGED', username);
      res.render("home",{'username':username});
    })
    .catch(function(error) {
        console.log(error);
      });
});

module.exports = router;