//Express Definition
const express = require("express");
const router = express.Router();

//Smartsheet Client
const client = require("smartsheet");

//Use the array in the front-end to use to loop across the field names
let arr = process.env.TERMS.split(",");


let response; // Consists of RowID
let termsArray; // Consists of terms and conditions ARRAY after regex


const { searchByProjectNumber, getRowInfoByRowNumber, getRowInfoByRowID, getAttachmentInfo, getColumnInformation, updateColumn, listColumns } = require("../utils");


//SheetMapping all the below variables contain the map with indices
const quoteColumnMap = require("../sheetmap/quoteColumnMap.json");
const productPricingMap = require("../sheetmap/productPricing.json");

//Lodash
const _ = require("lodash");
const { rearg } = require("lodash");
const { append } = require("express/lib/response");
const { sheet } = require("smartsheet/lib/utils/constants");
const { route } = require("./home");


//Quote-Previewer
router.get("/quote-previewer", function (req, res) {
    res.render("quote-previewer");
})

//POST Request for the entered row number
router.post("/quote-previewer", async function (req, res) {

    try {
        //console.log(req.body);
        // this contains the api response data
        let response;

        //Attachment Info - Nested Array consists of [Attachment name,URL]
        let attachmentInfo = [];

        if (req.body.refresh) { //the req.body.refresh comes from the user window which contains the row id

            console.log('The row Id is', req.body.refresh);

            //The response below contains the response via rowID
            response = await getRowInfoByRowID(req.body.refresh, res.locals.apiKey); // we get the row information for that specific row based on rowid

        } else if (req.body.rownumber) {

            console.log('The row number is', req.body.rownumber);

            //The response below contains the response via rownumber
            response = await getRowInfoByRowNumber(req.body.rownumber, res.locals.apiKey);

        } else {
            res.render("error");
        }
        //-> below we do operations on the response data

        //Collect Attachments Information if exist
        if (response.attachments) {

            for (var i = 0; i < response.attachments.length; i++) {
                const attachmentIdInfo = await getAttachmentInfo(response.attachments[i].id, res.locals.apiKey); //Consists of attachments ids
                attachmentInfo.push(attachmentIdInfo);
            }

        }

        //Collect terms and conditions if exist
        if (response.cells[quoteColumnMap.termsConditions].displayValue) {

            termsArray = response.cells[quoteColumnMap.termsConditions].displayValue.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        }

        // In the front end I do not want to refer to data using their indices
        const firstItemIndex = quoteColumnMap.itemCodeSat01;

        res.render("data", {
            "response": response,
            "rowdata": response.cells,
            "dv": 'displayValue', //Instead of typing out display value all the time in front end we use dv as short form
            "columnMap": quoteColumnMap,
            "firstItemIndex": firstItemIndex,
            "itemtotal": Number(response.cells[quoteColumnMap.itemTotal].displayValue),
            "fieldnames": arr,
            "termsArray": termsArray,
            "attachmentInfo": attachmentInfo
        });

    } catch (err) {
        console.log(err);
        res.render("error", { "msg": err.message });
    }

})

router.get("/rowInfo", async function (req, res) {
    try {

        //Attachment Info - Nested Array consists of [Attachment name,URL]
        let attachmentInfo = [];
        let rowId, response;

        if (req.query.rowId) {
            console.log('The row Id is', req.query.rowId);
            rowId = req.query.rowId;
            response = await getRowInfoByRowID(rowId, res.locals.apiKey); // we get the row information for that specific row based on rowid
        }

        else if (req.query.qtRefNo) {
            const quoteRefNumber = req.query.qtRefNo;
            const rowInfo = await searchByProjectNumber(quoteRefNumber, res.locals.apiKey);
            rowId = rowInfo.results[0].objectId;
            //The response below contains the response via rowID
            response = await getRowInfoByRowID(rowId, res.locals.apiKey); // we get the row information for that specific row based on rowid
        }

        else if (req.query.rowNumber) {
            const rowNumber = req.query.rowNumber;
            response = await getRowInfoByRowNumber(rowNumber, res.locals.apiKey);
        }

        else if (req.query.projectNo) {
            const projectNumber = _.capitalize(req.query.projectNo);
            const rowInfo = await searchByProjectNumber(projectNumber, res.locals.apiKey);
            if (rowInfo.totalCount == 0) throw Error('Could not find the project with project number you were looking for');
            for (var i = 0; i < rowInfo.totalCount; i++) {
                response = await getRowInfoByRowID(rowInfo.results[i].objectId, res.locals.apiKey);
                if (response.cells[quoteColumnMap.projectNo].displayValue == projectNumber) break;
            }
        }

        //-> below we do operations on the response data

        //Collect Attachments Information if exist
        if (response.attachments) {

            for (var i = 0; i < response.attachments.length; i++) {
                const attachmentIdInfo = await getAttachmentInfo(response.attachments[i].id, res.locals.apiKey); //Consists of attachments ids
                attachmentInfo.push(attachmentIdInfo);
            }

        }

        //Collect terms and conditions if exist
        if (response.cells[quoteColumnMap.termsConditions].displayValue) {

            termsArray = response.cells[quoteColumnMap.termsConditions].displayValue.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

        }

        // In the front end I do not want to refer to data using their indices
        const firstItemIndex = quoteColumnMap.itemCodeSat01;
        res.render("rowIdInformation", {
            "response": response,
            "rowdata": response.cells,
            "dv": 'displayValue', //Instead of typing out display value all the time in front end we use dv as short form
            "columnMap": quoteColumnMap,
            "firstItemIndex": firstItemIndex,
            "itemtotal": Number(response.cells[quoteColumnMap.itemTotal].displayValue),
            "fieldnames": arr,
            "termsArray": termsArray,
            "attachmentInfo": attachmentInfo
        });

    } catch (err) {
        console.log(err);
        res.send(err.message);
    }
})

//From the Project Number -> to get the quote based on project number
router.get("/projectdata", async function (req, res) {
    try {
        req.query.pno = _.capitalize(req.query.pno);
        console.log("Quote for: ", req.query.pno);
        const response = await searchByProjectNumber(req.query.pno, res.locals.apiKey); //Contains the search response for project number e.g. 'P3292'
        // res.send(response);
        // console.log(response.totalCount);
        if (response.totalCount == 0) {
            res.render("error");
        }
        for (var i = 0; i < response.totalCount; i++) {
            // console.log(response.results);
            const rowresponse = await getRowInfoByRowID(response.results[i].objectId, res.locals.apiKey);
            if (rowresponse.cells[quoteColumnMap.projectNo].displayValue == req.query.pno) {
                //Gets the Attachements in the row
                const attachmentInfo = [];
                //Only if attachments exist in the row
                if (rowresponse.attachments) {
                    for (var i = 0; i < rowresponse.attachments.length; i++) {
                        const attachmentIdInfo = await getAttachmentInfo(rowresponse.attachments[i].id, res.locals.apiKey); //Consists of attachments ids
                        attachmentInfo.push(attachmentIdInfo);
                    }
                }
                // console.log(rowresponse);
                if (rowresponse.cells[quoteColumnMap.termsConditions].displayValue) {
                    termsArray = rowresponse.cells[quoteColumnMap.termsConditions].displayValue.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                } //Only if the terms array exists then split

                //in the frontend i do not want any numbers to be indices hence save in a variable-->indicates where our first item starts
                const firstItemIndex = quoteColumnMap.itemCodeSat01;

                res.render("data", {
                    "response": rowresponse,
                    "rowdata": rowresponse.cells,
                    "dv": 'displayValue', //Instead of typing out display value all the time in front end we use dv as short form
                    "columnMap": quoteColumnMap,
                    "firstItemIndex": firstItemIndex,
                    "itemtotal": Number(rowresponse.cells[quoteColumnMap.itemTotal].displayValue),
                    "fieldnames": arr,
                    "termsArray": termsArray,
                    "attachmentInfo": attachmentInfo
                });
                break;
            };
        }
    } catch (err) {
        console.log(err);
        res.render("error", { "msg": err.message });
    }
})




router.get("/productinfo/:productid", async function (req, res) {

    try {

        const itemCode = req.params.productid;

        const resultsFromSearch = await searchByProjectNumber(itemCode, res.locals.apiKey, process.env.PPID);

        const rowId = resultsFromSearch?.results[0]?.objectId;
        if (!rowId) {
            throw Error('Product not able to load.');
        }
        const rowInformation = await getRowInfoByRowID(rowId, res.locals.apiKey, process.env.PPID);

        res.render("product-info", {
            "productInfo": {
                'Currency': rowInformation.cells[productPricingMap.currency].displayValue,
                'List Price': rowInformation.cells[productPricingMap.listPriceOrMrsp].displayValue,
                'Price To Sat': rowInformation.cells[productPricingMap.priceToSat].displayValue,
                'Sat Margin': rowInformation.cells[productPricingMap.saTsMargin].displayValue,
                'Custom Duty': rowInformation.cells[productPricingMap.customDuty].displayValue,
                'Category': rowInformation.cells[productPricingMap.category].displayValue,
                'Supplier Name': rowInformation.cells[productPricingMap.supplierName].displayValue,
                'Pricing Scheme': rowInformation.cells[productPricingMap.pricingScheme].displayValue,
                'Pricing Type': rowInformation.cells[productPricingMap.pricingType].displayValue,
                'Year': rowInformation.cells[productPricingMap.year].displayValue,
                'Price to SAT(AED)': rowInformation.cells[productPricingMap.priceToSatAed].displayValue,
                'SAT Sales Price (AED) Roundup': rowInformation.cells[productPricingMap.satSalesPriceAedRoundUp].displayValue,
                'SAT Margin (AED)': rowInformation.cells[productPricingMap.saTsMarginAed].displayValue,
                'VAT(AED)': rowInformation.cells[productPricingMap.vatAed].displayValue,
                'SAT Sales Price VAT (AED)': rowInformation.cells[productPricingMap.satSalesPriceVatAed].displayValue,
                'Exchange Rate': rowInformation.cells[productPricingMap.exchangeRate].displayValue
            }
        });

    } catch (err) {
        res.status(401).json({ err: err.message })
        console.log(err);
    }


})


router.put("/update/:rowId", function (req, res) {
    const sheetId = process.env.SHEETID; //Quotation sheet
    console.log(req.body.cells);
    var row = [
        {
            "id": req.params.rowId, //Row Id 
            "cells": req.body.cells
        }
    ];

    console.log(sheetId);

    // Set options - FIXED
    var options = {
        sheetId: sheetId,
        body: row
    };

    // Update rows in sheet
    client.createClient({ accessToken: res.locals.apiKey, logLevel: 'info' }).sheets.updateRow(options)
        .then(function (updatedRows) {
            console.log(updatedRows);
            res.send('Successfully Updated');
        })
        .catch(function (error) {
            res.status(401).send(error);
            console.log(error);
        });
})

router.post("/update/:sheetId/:columnId", async function (req, res) {
    try {
        const sheetId = req.params.sheetId// c/s copy
        const columnId = req.params.columnId //Column for the organization name

        console.log(req.body);

        const resp = await updateColumn(sheetId, columnId, req.body, res.locals.apiKey);
        console.log(resp);
        res.send(resp);

    } catch (err) {
        const statusCode = err.statusCode || 401;
        res.status(statusCode).send(err);
        console.log(err);
    }
})


//Edit picklist page
router.get("/editPicklist", function (req, res) {
    res.render("PickList/columns");
})

//Get list of columns
router.get("/columns/:columnId", async function (req, res) {
    const columnid = req.params.columnId;
    console.log(columnid);
    const resp = await listColumns(columnid, res.locals.apiKey)
    res.render("PickList/dynamic", { "resp": resp });
})


//Gives the column Id info
router.get("/columns/:sheetId/:columnId", async function (req, res) {
    const sheetId = req.params.sheetId;
    const columnid = req.params.columnId;

    const resp = await getColumnInformation(sheetId, columnid, res.locals.apiKey);

    res.render("PickList/columnData", { "resp": resp });
})


module.exports = router;