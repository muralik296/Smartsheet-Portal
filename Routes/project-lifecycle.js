const express = require("express");
const router = express.Router();

//Smartsheet Client
const client = require("smartsheet");

//Lodash
const _ = require('lodash');

//Utils
const {projectLife, getRowInfoByRowID } = require("../utils");



//SheetMapping all the below variables contain the map with indices
const leadColumnMap = require("../sheetmap/leadColumnMap.json"),
      tenderColumnMap = require("../sheetmap/tenderColumnMap.json"),
      projectColumnMap = require("../sheetmap/projectColumnMap.json"),
      quoteColumnMap = require("../sheetmap/quoteColumnMap.json"),
      resellerColumnMap = require("../sheetmap/resellerColumnMap"),
      dealRegistration = require("../sheetmap/dealRegistration.json");

// Project Lifecycle

router.get("/project-lifecycle", function(req, res) {
  res.render("project-lifecycle");
})

router.post("/project-lifecycle",async function(req,res){

  const projectNumber = _.upperCase(req.body.pno);
  const response = await projectLife(req.body.pno, res.locals.apiKey);
  const sheets = process.env.SHEETS.split(",");
  // res.send(response);
  const mainObject = {};
  const dv = 'displayValue';
  // mainObject['Leads'] = mainObject['Projects'] = mainObject['Tenders'] = mainObject['Quotation'] = mainObject['Resellers'] ={};
  //console.log(mainObject);

  //response.results
  const responseArray = response.results;

  //console.log(responseArray.length);

  for (var i=0; i< responseArray.length ; i++){

    const sheetName = responseArray[i].parentObjectName;
    const type = responseArray[i].objectType;

    if (sheets.includes(sheetName) && type=="row"){

      const sheetId = responseArray[i].parentObjectId; //Leads tenders , projects, quotes sheet id
      const rowId = responseArray[i].objectId; // row id

      const response = await getRowInfoByRowID(rowId , res.locals.apiKey ,sheetId); //response containing rowinfo from rowid and sheetid
      const cells = response.cells;
      // console.log(cells);
      if (sheetName == sheets[0] || sheetName == sheets[1]){ //leads

        mainObject['Leads'] = {};
        mainObject['Leads']['SAT Ref No'] = cells[leadColumnMap.satRefNo][dv];
        mainObject['Leads']['Client Name'] = cells[leadColumnMap.clientName][dv];
        mainObject['Leads']['Organization'] = cells[leadColumnMap.organization][dv];
        mainObject['Leads']['Status'] = cells[leadColumnMap.status][dv];

      } else if (sheetName == sheets[2] || sheetName == sheets[3]){

        mainObject['Tenders'] = {};
        mainObject['Tenders']['SAT Ref no'] = cells[tenderColumnMap.satRefNo][dv];
        mainObject['Tenders']['Due Date'] = cells[tenderColumnMap.dueDate]['value'];
        mainObject['Tenders']['Tender Portal'] = cells[tenderColumnMap.tenderPortal][dv];
        mainObject['Tenders']['Organization'] = cells[tenderColumnMap.organization][dv];
        mainObject['Tenders']['Client name'] = cells[tenderColumnMap.clientName][dv];
        mainObject['Tenders']['Tender RFQ'] = cells[tenderColumnMap.tenderRfqNo][dv];
        mainObject['Tenders']['Enduser Country'] = cells[tenderColumnMap.endUserCountry][dv];
        mainObject['Tenders']['Description'] = cells[tenderColumnMap.descriptionRequirement][dv];
        
      }else if (sheetName == sheets[4] || sheetName == sheets[5]){
        // res.send(response);
        mainObject['Projects'] = {};
        mainObject['Projects']['Project no'] = cells[projectColumnMap.projectNo][dv];
        mainObject['Projects']['Project Name']= cells[projectColumnMap.projectName][dv];
        mainObject['Projects']['Description'] = cells[projectColumnMap.descriptionRequirement][dv];
        mainObject['Projects']['Quotation Status'] = cells[projectColumnMap.quotationStatus][dv];
        mainObject['Projects']['Purchase Order'] = cells[projectColumnMap.purchaseOrderReceived]['value'];
        mainObject['Projects']['Resellers'] = cells[projectColumnMap.reSellerLinks][dv];

      }else if(sheetName == sheets[6] || sheetName == sheets[7]){

        mainObject['Quotations'] = {};
        mainObject['Quotations']['Quote Ref No'] = cells[quoteColumnMap.qtRefNo][dv];
        mainObject['Quotations']['Quote Issue Date'] = cells[quoteColumnMap.quoteIssueDate]['value'];
        mainObject['Quotations']['Approval'] = cells[quoteColumnMap.approval][dv];
        mainObject['Quotations']['Status'] = cells[quoteColumnMap.status][dv];
        mainObject['Quotations']['Total Cost'] = cells[quoteColumnMap.totalCost][dv];
        mainObject['Quotations']['Total Margin'] = cells[quoteColumnMap.totalMargin][dv];

      }else if(sheetName == sheets[8]){

        mainObject['Resellers'] = {};
        mainObject['Resellers']['Reseller Ref No'] = cells[resellerColumnMap.referenceNo][dv];
        mainObject['Resellers']['Company'] = cells[resellerColumnMap.company][dv];
      }else if(sheetName == sheets[9]){

          mainObject['Deal Registration'] = {};
          mainObject['Deal Registration']['SAT Ref No'] = cells[dealRegistration.satRefNo][dv];
          mainObject['Deal Registration']['Re-seller Company'] = cells[dealRegistration.resellerCompany][dv];
          mainObject['Deal Registration']['Re-seller Country'] = cells[dealRegistration.reSellerCountry][dv];
          mainObject['Deal Registration']['End-User Name'] = cells[dealRegistration.endUserName][dv];
          mainObject['Deal Registration']['End-User Country'] = cells[dealRegistration.endUserCountry][dv];
          mainObject['Deal Registration']['End User Position'] = cells[dealRegistration.endUserPosition][dv];
          mainObject['Deal Registration']['Description'] = cells[dealRegistration.descriptionRequirement][dv];
      }
    }

  }

  const lengthOfMainObject = Object.keys(mainObject).length;
  // console.log(mainObject);
  // console.log(lengthOfMainObject);

  let divisions = Math.floor(12/lengthOfMainObject);
  // console.log(divisions);

  res.render("project-lifecycle-post",{"projectNumber":projectNumber, "mainObject":mainObject , "lengthOfMainObject":lengthOfMainObject , "sheets":sheets , "divisions":divisions });

});

module.exports = router;