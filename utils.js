const client = require("smartsheet");
const sheet = process.env.SHEETID;
const quoteColumnMap = require("./sheetmap/quoteColumnMap.json");
const _ = require("lodash");

//Function for calibration can be used for recalibrating the order of indices in case of new columns or deleted columns
function calibrate(key, sheetId = sheet) {

  return new Promise(function (resolve, reject) {
    var options = {
      sheetId: sheetId
    }
    client.createClient({ accessToken: key, logLevel: 'info' }).sheets.getColumns(options)
      .then(function (column) {
        for (var i = 0; i < column.data.length; i++) {
          quoteColumnMap[_.camelCase(column.data[i].title)] = column.data[i].index
        }
        resolve(quoteColumnMap);
      })
      .catch(function (error) {
        reject(error);
      });
  })
}



//Function for searching through different sheets returns an object with its findings - For Project Lifecycle // basically searching through all the sheets
// Returns where all sheets the project has been through
// This will return us with the meta data for that sheet
function projectLife(project, key) {
  return new Promise(function (resolve, reject) {
    var options = {
      query: project
    }

    client.createClient({ accessToken: key, logLevel: 'info' }).search.searchAll(options)
      .then(function (results) {
        resolve(results);
      })
      .catch(function (error) {
        console.log(error);
      });
  })
}


//Function for searching Project number as a dictionary
function searchByProjectNumber(project, key, sheetId = sheet) {
  return new Promise(function (resolve, reject) {
    var options = {
      sheetId: sheetId,
      queryParameters: {
        query: project //Project number to be used for search
      }
    };

    // Search sheet
    client.createClient({ accessToken: key, logLevel: 'info' }).search.searchSheet(options)
      .then(function (data) {
        resolve(data);
      })
      .catch(function (error) {
        console.log(error);
      });
  })
}


//Function for getting Row Info using SheetID - ** QUOTATION SHEET **
function getRowInfoByRowNumber(row, key, sheetId = sheet) {
  return new Promise(function (resolve, reject) {
    var options = {
      id: sheetId,
      queryParameters: {
        pageSize: 1,
        page: row,
        include: 'attachments' //Includes Attachments
      }
    }
    client.createClient({ accessToken: key, logLevel: 'info' }).sheets.getSheet(options)
      .then(function (sheetInfo) {
        if (row > sheetInfo.totalRowCount) {
          throw Error("Invalid Row Number");
        }
        resolve(sheetInfo.rows[0]); //Contains the Row Info cells:[...] response from API
      })
      .catch(function (error) {
        reject(error);
        // console.log(error);
      });
  })
}

//Function for getting Row Info by ROW ID ** QUOTATION SHEET **
function getRowInfoByRowID(rowID, key, sheetId = sheet) {
  return new Promise(function (resolve, reject) {
    var options = {
      sheetId: sheetId,
      rowId: rowID,
      queryParameters: {
        include: 'attachments' //Includes Attachments
      }
    }
    client.createClient({ accessToken: key, logLevel: 'info' }).sheets.getRow(options)
      .then(function (row) {
        resolve(row);
      })
      .catch(function (error) {
        console.log(error);
      });
  })
}


//Function for getting Attachmenrt URL + Name
function getAttachmentInfo(attachmentID, key, sheetId = sheet) {
  return new Promise(function (resolve, reject) {
    var options = {
      sheetId: sheetId,
      attachmentId: attachmentID
    };

    // Get attachment
    client.createClient({ accessToken: key, logLevel: 'info' }).sheets.getAttachment(options)
      .then(function (attachment) {
        resolve([attachment.name, attachment.url]); //Contains array with [attachmentname,URL]
      })
      .catch(function (error) {
        console.log(error);
      });
  })
}

function getColumnInformation(sheetId, columnId, key) {
  return new Promise(function (resolve, reject) {
    const options = {
      sheetId: sheetId,
      columnId: columnId,
      queryParameters: { include: "objectValue", level: "2" }
    };

    // Get column
    client.createClient({ accessToken: key, logLevel: 'info' }).sheets.getColumns(options)
      .then(function (column) {
        resolve(column);
      })
      .catch(function (error) {
        reject(error);
      });
  })
}


function updateColumn(sheetId, columnId, body, key) {
  return new Promise(function (resolve, reject) {

    // Set options
    var options = {
      sheetId: sheetId,
      columnId: columnId,
      body: body
    };

    // Get column
    client.createClient({ accessToken: key, logLevel: 'info' }).sheets.updateColumn(options)
      .then(function (updatedColumn) {
        resolve(updatedColumn);
      })
      .catch(function (error) {
        reject(error);
      });
  })
}


function listColumns(sheetId, key) {
  return new Promise(function (resolve, reject) {
    // Set options
    var options = {
      sheetId: sheetId
    };

    // List columns
    client.createClient({ accessToken: key, logLevel: 'info' }).sheets.getColumns(options)
      .then(function (columnList) {
        resolve(columnList);
      })
      .catch(function (error) {
        reject(error);
      });
  })

}
module.exports = { calibrate, projectLife, searchByProjectNumber, getRowInfoByRowNumber, getRowInfoByRowID, getAttachmentInfo, getColumnInformation, updateColumn, listColumns }
