//main関数
function scrapeExchangeToSheet() {
  var now = new Date();
  if(!stopScrape(now)){
    var ex_json = exchange.callExchangeAPI();
    exchange.writeSheets(ex_json);
  }
}

function stopScrape(date){
  var stop = 0;
  var now = date;
  if(now.getDay()==6 && now.getHours()>=6){
    stop = 1;
    if(now.getMinutes()<50){
      stop = 0;
    }
  }
  if(now.getDay()==0 || now.getDay()==1 && now.getHours()<=6){
    stop = 1;
    }
  Logger.log(stop);
  return stop;
  }

//シート取得関数（クラス）
var exchange = {
  getSheet: function() {
    if(this.getSheet.sheet) { return this.getSheet.sheet; }

    var SHEET_URL = PropertiesService.getScriptProperties().getProperty('SHEET_URL');
    if (!SHEET_URL) {
      throw 'You should set "SHEET_URL" property from [File] > [Project properties] > [Script properties]';
    }

    var sheets = SpreadsheetApp.openByUrl(SHEET_URL);
    this.getSheet.sheet = sheets.getActiveSheet();
    return this.getSheet.sheet;
  },
  
   // call exchange API関数
  callExchangeAPI: function() {
    var now      = new Date(),
        url      = "https://www.gaitameonline.com/rateaj/getrate",
        response = UrlFetchApp.fetch(url),
        content  = response.getContentText(),
        fx       = JSON.parse(content);

    fx.date = now;
    return fx;
  },

  //APIから取得したJSONデータをシートに書き込む
  // Write exchange data (JSON) to the Google Sheet
  writeSheets: function(ex_json) {
    var sheet = this.getSheet();

    // get last row to add exchange data
    var last_row = sheet.getLastRow() + 1;

    var col = 1;
    sheet.getRange(last_row, col++).setValue(ex_json.date);

    for each(var quote in ex_json.quotes) {
      if(quote.currencyPairCode == 'GBPJPY'){
        sheet.getRange(last_row, col++).setValue(quote.currencyPairCode);
        sheet.getRange(last_row, col++).setValue(quote.high);
        sheet.getRange(last_row, col++).setValue(quote.low);
        sheet.getRange(last_row, col++).setValue(quote.ask);
        sheet.getRange(last_row, col++).setValue(quote.bid);
        sheet.getRange(last_row, col++).setValue(quote.open);
      }
    }
  }
}