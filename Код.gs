//file structure//
// x* timestamp
//   n* [directory]
//      M* field_name: value
//output in spreadsheet
//  directory to sheet
//  time in rows
//  fields in columns
//  values at cells

// TODO: insert rows with time at all datasheets (sync in graph)
// TODO: remove ' from time at the end of proc
function importFromTextLog() {
  var fileName = "du.txt"; //Browser.inputBox("Enter the name of the file in your Docs List to import:");
  var files = DocsList.getFiles();
  var FileContent = "";

  for (var i = 0; i < files.length; i++) {
    var curFileName = files[i].getName();
    
    if (curFileName == fileName) {
      var FileContent = files[i].getContentAsString();
      break;
    }
  }
  if (FileContent == "") return;

  var FileContentStrings = FileContent.split(/\r\n/);  
  FileContent="";
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i=0; i<sheets.length; i++) {
    if (sheets[i].getName() != "graph") sheets[i].clear();
  }
  var sheet = ss.getSheets()[0];
  var isFirstDir = true;
  var str = "";
  var strTimeStamp = "";
  //var Directory = "";
  var expect = "T"; // T | D | F
  regexpEmpty = /^\s+$/;
  
  //////////////////////////////////////////////////////////
  // isDirStr //
  var isDirStr = function(str)
  {
    regexp = /^\[/; return regexp.test(str);
  };
  // isTimeStr //
  var isTimeStr = function(str) {
    regexp = /^\d/; return regexp.test(str);
  };
  // isFieldStr //
  var isFieldStr = function(str) {
    regexp = /^[\w\s]+:.+/; return regexp.test(str);
  };
  // GetOrCreateSheet //
  var GetOrCreateSheet = function(str, spreadsheet) {
    var st = spreadsheet.getSheetByName(str);
    if (st == null) var st = spreadsheet.insertSheet(str, spreadsheet.getSheets().length);
    return st;
  };
  // writeDataField //
  var writeDataField = function(KeyValueStr, strRowLabel, sheetRef) {
    var FieldName = KeyValueStr.split(":")[0].replace(/\s*(\S*\s*\S+)\s*/, '$1'); // convert to one regex
    var FieldValue = KeyValueStr.split(":")[1].replace('bytes','').replace(/\s*(\S*\s*\S+)\s*/, '$1');
    
    var dataR = sheetRef.getDataRange();
    var Ncolumns = dataR.getWidth()-1;
    var FieldColumn = 0;
    if (Ncolumns != 0 ) {
      var DirFieldsR = sheetRef.getRange(1, 2, 1, Ncolumns);
      var DirFieldsNames = DirFieldsR.getValues()[0];
      for (var j = 0; j < Ncolumns; j++) {
        if (FieldName == DirFieldsNames[j].valueOf()) {
          FieldColumn = j+1;
          break;
        }
      };
    }
    if (FieldColumn == 0) {
      sheetRef.getRange(1, Ncolumns+1+1, 1, 1).setValue(FieldName);
      Ncolumns += 1;
      FieldColumn = Ncolumns;
    };
    var NewOrLast = 0;
    var strLastRowLabel = "'" + sheetRef.getRange(dataR.getLastRow(), 1, 1, 1).getValue();
    if (strLastRowLabel != strRowLabel) {
      NewOrLast = 1;
      sheetRef.getRange(dataR.getLastRow()+NewOrLast, 1, 1, 1).setValue(strRowLabel);
    }
    sheetRef.getRange(dataR.getLastRow()+NewOrLast, FieldColumn+1, 1, 1).setValue(FieldValue);
  };
  //////////////////////////////////////////////////////////
  
  for (var i = 0; i < FileContentStrings.length; i++) {
    str = FileContentStrings[i].replace(/\s*(\S*\s*\S+)\s*/, '$1');
    if (!regexpEmpty.test(str)) {
      switch (expect) {
        case "T":
          if (!isTimeStr(str)) {
           break;
          }
          strTimeStamp = "'" + str;
          expect = "D";
          break;
          
        case "D":
          if (!isDirStr(str)) {
           break;
          }
          if (isFirstDir) sheet.setName(str);
          else sheet = GetOrCreateSheet(str, ss);
          isFirstDir = false;
          expect = "F";
          break;
          
        case "F":
          if (!isFieldStr(str)) {
           break;
          }
          writeDataField(str, strTimeStamp, sheet);
          expect = "TDF";
          break;
          
        case "TDF":
          if (isTimeStr(str)) {
            strTimeStamp = "'" + str;
            expect = "D";
          }
          else if (isDirStr(str)) {
            sheet = GetOrCreateSheet(str, ss);
            expect = "F";
          }
          else if (isFieldStr(str)) {
            writeDataField(str, strTimeStamp, sheet);
            expect = "TDF";
          }
          else {
          };
          break;
      }
    }
  }
  
};
  
function onOpen() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  //var menuEntries = [];
  //menuEntries.push({name: "Menu Entry 1", functionName: "function1"});
  //menuEntries.push(null); // line separator
  
  var csvMenuEntries = [{name: "Import data from text log (du.txt)", functionName: "importFromTextLog"}];
  ss.addMenu("Import", csvMenuEntries);
}
