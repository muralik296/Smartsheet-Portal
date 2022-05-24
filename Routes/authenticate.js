const express = require("express");
const router = express.Router();


const config = require('../config.json');
const qs = require('querystring');

//Smartsheet Client
const client = require("smartsheet");

//Initialize client
var smartsheet = client.createClient({
    accessToken: '',
    logLevel: 'info'
  });

//The link for authorization
const authorizationUri = authorizeURL({
    response_type: 'code',
    client_id: config.APP_CLIENT_ID,
    scope: config.ACCESS_SCOPE
});


//the const authorizationUri will contain the url --> app.smartsheet.com/b/authorize/clientid+....

router.get('/auth', function (req, res) {
    //registered cookie
    console.log('Your authorization URL: ', authorizationUri);
    res.redirect(authorizationUri);
})



// callback service parses the authorization code, requests access token, and saves it
router.get('/redirect', function (req, res) {

    //console.log(req.query);
    const authCode = req.query.code;
    const generated_hash = require('crypto')
        .createHash('sha256')
        .update(config.APP_SECRET + "|" + authCode)
        .digest('hex');
    const options = {
        queryParameters: {
            client_id: config.APP_CLIENT_ID,
            code: authCode,
            hash: generated_hash
        }
    };
    smartsheet.tokens.getAccessToken(options, processToken)
        .then((token) => {
            res.cookie("session_id", token.access_token, { maxAge: token.expires_in * 1000 });
            res.redirect("/");
        })
        .catch((err) => {
            res.redirect("/auth");
        });
});


//oAuth helper functions

function processToken(error, token) {
    if (error) {
        console.error('Access Token Error:', error.message);
        return error;
    }
    //console.log('The resulting token: ', token);
    // IMPORTANT: token saved to local JSON as EXAMPLE ONLY.
    // You should save access_token, refresh_token, and expires_in to database for use in application.
    let returned_token = {
        "ACCESS_TOKEN": token.access_token,
        "EXPIRES_IN": (Date.now() + (token.expires_in * 1000)),
        "REFRESH_TOKEN": token.refresh_token
    }
    return token;
}


// helper function to assemble authorization url
function authorizeURL(params) {
    const authURL = 'https://app.smartsheet.com/b/authorize';
    return `${authURL}?${qs.stringify(params)}`;
}

module.exports = router;