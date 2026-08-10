/**
 * Form29_Automation.gs
 * 
 * Google Apps Script for Form No. 29 — Register of accidents, major accidents and dangerous occurrences (Rule 111)
 * 
 * Instructions:
 * 1. Open your Google Sheet containing the 'amtran' and 'Employee Master Data' tabs.
 * 2. Click Extensions > Apps Script in the Google Sheets menu bar.
 * 3. Delete any code in Code.gs and paste this entire code into the script editor.
 * 4. (Optional) Set FOLDER_ID below if you want to target a specific Google Drive folder ID, or leave blank to auto-create "Form 29 PDFs".
 * 5. Save the project (Ctrl+S) and refresh your Google Sheet tab.
 * 6. You will see a new menu: "PDF Automation" > "Generate Form 29 PDF".
 */

// Global Configurations
var CONFIG = {
  TEMPLATE_SHEET: "amtran",
  DATA_SHEET: "Employee Master Data",
  FOLDER_NAME: "Form 29 PDFs",
  TARGET_FOLDER_ID: "", // Paste your Google Drive Folder ID here if available (e.g., "1a2b3c4d5e...")
  START_ROW: 12
};

/**
 * Creates custom menu in Google Sheets UI upon spreadsheet opening.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("PDF Automation")
    .addItem("📄 Generate Form 29 PDF", "generateForm29PDF")
    .addToUi();
}

/**
 * Main execution function: Populates amtran template, exports PDF to Drive, and resets template.
 */
function generateForm29PDF() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var templateSheet = ss.getSheetByName(CONFIG.TEMPLATE_SHEET);
  var dataSheet = ss.getSheetByName(CONFIG.DATA_SHEET);

  if (!templateSheet) {
    ui.alert("Error: Template tab '" + CONFIG.TEMPLATE_SHEET + "' not found.");
    return;
  }

  try {
    // 1. Read month metadata from cell N5 / O5 if available, else current month
    var monthValue = templateSheet.getRange("N5").getValue() || templateSheet.getRange("O5").getValue();
    var monthStr = monthValue ? String(monthValue).replace(/[^a-zA-Z0-9_-]/g, "_") : "AUG-2025";

    // 2. Populate sample/data rows starting at Row 12 if dataSheet exists
    if (dataSheet && dataSheet.getLastRow() >= 2) {
      var sourceData = dataSheet.getRange(2, 1, dataSheet.getLastRow() - 1, dataSheet.getLastColumn()).getValues();
      var outputRows = [];

      for (var i = 0; i < sourceData.length; i++) {
        var row = sourceData[i];
        // Col A to O mapping
        outputRows.push([
          i + 1,                                // A: Serial number
          row[1] || "02/08/2025 09:30 AM",     // B: Date & time of notice
          (row[2] || "Employee") + " (" + (row[0] || "EMP001") + ")", // C: Name & serial number
          row[3] || "3714892015",               // D: ESIC Insurance number
          row[4] || "02/08/2025",               // E: Date
          row[5] || "09:15 AM",                 // F: Time
          row[6] || "Shop Floor Unit-2",        // G: Place
          row[7] || "Minor slip during handling",// H: Cause of accident
          row[8] || "First Aid / Minor Sprain", // I: Nature of injury
          row[9] || "Moving component",         // J: Activity doing
          row[10] || "Supervisor",              // K: Person giving notice
          row[11] || "Witness 1 & Witness 2",   // L: Witnesses
          row[12] || "04/08/2025",              // M: Date return to work
          row[13] || 2,                         // N: Number of days absent
          row[14] || "HR Executive"             // O: Signature & designation
        ]);
      }

      if (outputRows.length > 0) {
        templateSheet.getRange(CONFIG.START_ROW, 1, outputRows.length, 15).setValues(outputRows);
      }
    }

    SpreadsheetApp.flush();
    Utilities.sleep(500);

    // 3. Locate or Create target Google Drive Folder
    var folder = getOrCreateDriveFolder();

    // 4. Export amtran tab as PDF (Landscape A4, Fit to width)
    var pdfBlob = exportSheetToPdfBlob(ss, templateSheet, "Form_29_Accident_Register_" + monthStr + ".pdf");

    // 5. Save PDF into Google Drive Folder
    var pdfFile = folder.createFile(pdfBlob);
    var fileUrl = pdfFile.getUrl();

    // 6. Reset template data rows (Row 12+)
    var lastRow = templateSheet.getLastRow();
    if (lastRow >= CONFIG.START_ROW) {
      templateSheet.getRange(CONFIG.START_ROW, 1, lastRow - CONFIG.START_ROW + 1, 15).clearContent();
    }

    ui.alert("Success!", "Form 29 PDF generated successfully!\n\nSaved to Drive folder: '" + folder.getName() + "'\nFile Name: " + pdfFile.getName() + "\n\nFile Link: " + fileUrl, ui.ButtonSet.OK);

  } catch (err) {
    ui.alert("Error during Form 29 PDF generation:\n" + err.toString());
  }
}

/**
 * Helper to retrieve or automatically create the target Google Drive Folder.
 */
function getOrCreateDriveFolder() {
  if (CONFIG.TARGET_FOLDER_ID && CONFIG.TARGET_FOLDER_ID.trim() !== "") {
    try {
      return DriveApp.getFolderById(CONFIG.TARGET_FOLDER_ID.trim());
    } catch (e) {
      Logger.log("Specified Folder ID invalid. Falling back to folder search.");
    }
  }

  var folders = DriveApp.getFoldersByName(CONFIG.FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(CONFIG.FOLDER_NAME);
}

/**
 * Export specific sheet to landscape PDF blob formatted to fit page width.
 */
function exportSheetToPdfBlob(spreadsheet, sheet, pdfFileName) {
  var ssId = spreadsheet.getId();
  var sheetId = sheet.getSheetId();

  var url = "https://docs.google.com/spreadsheets/d/" + ssId + "/export?";
  var exportOptions = {
    exportFormat: "pdf",
    format: "pdf",
    size: "A4",               // A4 size
    portrait: "false",        // Landscape mode
    fitw: "true",             // Fit to page width
    gridlines: "true",        // Include gridlines
    printtitle: "false",
    sheetnames: "false",
    fzr: "false",
    gid: sheetId
  };

  var urlParts = [];
  for (var key in exportOptions) {
    urlParts.push(key + "=" + exportOptions[key]);
  }
  var exportUrl = url + urlParts.join("&");

  var response = UrlFetchApp.fetch(exportUrl, {
    headers: {
      "Authorization": "Bearer " + ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });

  return response.getBlob().setName(pdfFileName);
}
