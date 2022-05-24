
const express = require("express");
const router = express.Router();

//Smartsheet Client
const client = require("smartsheet");

//Calibration
const { calibrate } = require("../utils");
const quoteColumnMap  = require("../sheetmap/quoteColumnMap.json");
const fs  = require("fs");


//Middleware for signin check
function signin_check(req, res, next) {
    if (req.body.user == process.env.USR && req.body.pass == process.env.PASS) {
        next();
    } else {
        console.log(req.body);
        res.redirect("/admin");
    }
}

//------- --Admin panel-- -----------

router.get("/admin", function (req, res) {
    res.render("admin/admin-login");
});


router.post("/admin", signin_check, function (req, res, next) {
    res.render("admin/admin-panel");
});

router.post("/result", async function (req, res) {
    if (req.body.sheetName) {
        var options = {
            id: req.body.sheetName,
            queryParameters: {
                pageSize: 1
            }
        }
        client.createClient({ accessToken: res.locals.apiKey, logLevel: 'info' }).sheets.getSheet(options)
            .then(function (sheetInfo) {

                res.render("admin/result", {
                    "totalRows": sheetInfo.totalRowCount,
                    "totalColumns": sheetInfo.columns.length,
                    "sheetName": sheetInfo.name,
                    "link": sheetInfo.permalink
                });
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    else if (req.body.recalibrate == '2') {
        console.log('logged');
        const afterCalibrationResult = await calibrate(res.locals.apiKey);
        console.log(afterCalibrationResult);
        
        fs.writeFileSync("./sheetMap/quoteColumnMap.json", JSON.stringify(afterCalibrationResult) );

        res.render("admin/result", { "columnMap": quoteColumnMap });
    }
});

module.exports = router;