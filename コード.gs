//main関数
function scrapeExchangeToSheet() {
  var now = new Date();
  var sheet = exchange.getSheet();
  //稼働時間中で5分毎にデータを書き込む
  if(stopScrape(now)==0){
    var ex_json = exchange.callExchangeAPI();
    exchange.writeSheets(ex_json);
    exchange.writeTrend();
    if(now.getMinutes()==0 && now.getHours()!=7){
      updateExtreme();
    }
  }
  //データの上限を制限
  if(sheet.getActiveSheet().getLastRow()>5000){
    exchange.delOld();
  }
}

function updateExtreme(){
  var now = new Date();
  var life_span = 11;
  var ss  = exchange.getSheet()
  var sheet = ss.getSheetByName('extreme_value');
  var last_row = sheet.getLastRow();
  var update = sheet.getRange(last_row-1,1,1,5);
  var upd_val = update.getValues()[0];
  var values = [0,0,0,0,0];
  var last_extreme = getEx();//直前の極値
  var position = getNow();//現在の買値と売値
  
  //寿命が先に切れた時
  if(upd_val[1]<0){
    values = [now,life_span,upd_val[2],position[1-upd_val[2]],0];
    update.setValues(values);
  }
  //寿命切れ
  if(upd_val[1]==0){
    //次なる極値を追加
    values = [now,life_span,upd_val[2],last_extreme[1-upd_val[2]],0];
    sheet.getRange(last_row+1,1,1,5).setValues(values);
    //極値を確定,前の極値と比較
    var past_extreme = sheet.getRange(last_row-4,4).getValue();
    values = [now,'done',upd_val[2],upd_val[3],upd_val[3]-past_extreme];
    sheet.getRange(last_row-2,1,1,5).setValues(values);
    update = sheet.getRange(last_row-1,1,1,5);
    upd_val = update.getValues()[0];
  }
  
  for(i=0; i<2; i++){
    //最高値の更新
    if(upd_val[2]==1){
      if(upd_val[3]<last_extreme[0]){
        values=[now,life_span,upd_val[2],last_extreme[0],0]
        update.setValues(values)
      }else{
        sheet.getRange(last_row-1+i,2),setValue(upd_val[2]-1);//寿命経過
      }
    }
    //最安値の更新
    if(upd_val[2]==0){
      if(upd_val[3]>last_extreme[1]){
        values=[now,life_span,upd_val[2],last_extreme[1],0]
        update.setValues(values)
      }else{
        sheet.getRange(last_row-1+i,2),setValue(upd_val[2]-1);//寿命経過
      }
    }
    update = sheet.getRange(last_row,1,1,5);
    upd_val = update.getValues()[0];
  }
  
}
//直近の最高値と最安値を取得
function getEx(){
  var sheet = exchange.getSheet().getActiveSheet();
  var last_row = sheet.getLastRow();
  Logger.log(sheet.getRange(last_row,3,1,2).getValues()[0]);
  return sheet.getRange(last_row,3,1,2).getValues()[0];
}

function getNow(){
  var sheet = exchange.getSheet().getActiveSheet();
  var last_row = sheet.getLastRow();
  Logger.log(sheet.getRange(last_row,5,1,2).getValues()[0]);
  return sheet.getRange(last_row,5,1,2).getValues()[0];
}

function tmp(){
  var now = new Date();
  var ss  = exchange.getSheet()
  var sheet2 = ss.getActiveSheet();
  var sheet = ss.getSheetByName('extreme_value');
  var last_row = sheet.getLastRow();
  var last_row2 = sheet2.getLastRow(); 
  var update = sheet.getRange(last_row-1,1,1,5);
  var upd_val = [0,0,0,0,0];
  var last_extreme = sheet2.getRange(last_row2,3,1,2);
  var life_span = update.getValues();
  Logger.log(update.getValues()[0][1]);
}

//土曜日6:50~月曜日6:59のスクレイピング停止
function stopScrape(date){
  var stop = 0;
  var now = date;
  if(now.getDay()==6 && now.getHours()>=6){
    stop = 1;
  }
  if(now.getDay()==6 && now.getHours()==6 && now.getMinutes()<50){
      stop = 0;
  } 
  if(now.getDay()==0 || now.getDay()==1 && now.getHours()<=6){
    stop = 1;
    }
  Logger.log(stop);
  return stop;
  }

//スクレイピングクラス
var exchange = {
  //シート取得関数
  getSheet: function() {
    if(this.getSheet.sheet) { return this.getSheet.sheet; }

    var SHEET_URL = PropertiesService.getScriptProperties().getProperty('SHEET_URL');
    if (!SHEET_URL) {
      throw 'You should set "SHEET_URL" property from [File] > [Project properties] > [Script properties]';
    }

    var sheets = SpreadsheetApp.openByUrl(SHEET_URL);
    this.getSheet.sheet = sheets;
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

  //APIから取得したJSONデータをシートに書き込む関数
  // Write exchange data (JSON) to the Google Sheet
  writeSheets: function(ex_json) {
    var sheet = this.getSheet().getActiveSheet();

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
  },
  
  //大きいトレンドの判断
   big_trend: function(){
    return 0;
  },
  
  //小さいトレンドの判断(１時間前と比較)
  small_trend: function(sheet){
    var last_row = sheet.getLastRow();
    var past_ask = sheet.getRange(last_row-6,5).getValue();
    var now_ask = sheet.getRange(last_row,5).getValue();
    if(now_ask-past_ask>0){
      return 1;
    }else{
      return 0;
    }
  },
  
  //最高値更新
  over_high: function(sheet){
    var last_row = sheet.getLastRow();
    var past_high = sheet.getRange(last_row-1,3).getValue();
    var now_high = sheet.getRange(last_row,3).getValue();
    return now_high-past_high;
  },
  
  //最安値更新
  over_low: function(sheet){
    var last_row = sheet.getLastRow();
    var past_low = sheet.getRange(last_row-1,4).getValue();
    var now_low = sheet.getRange(last_row,4).getValue();
    return now_low-past_low;
  },
  
  //トレンド判断の書き込み
  writeTrend: function(){
    var sheet = this.getSheet().getActiveSheet();
    var sheet2 = this.getSheet().getSheetByName('data_1day');
    var last_row = sheet.getLastRow();
    sheet.getRange(last_row,8).setValue(this.big_trend());
    sheet.getRange(last_row,9).setValue(this.small_trend(sheet));
    sheet.getRange(last_row,10).setValue(this.over_high(sheet));
    sheet.getRange(last_row,11).setValue(this.over_low(sheet));
  },
  
  //極値記録
  extreme_value: function(){
    var sheet = this.getSheet().getActiveSheet();
    var sheet2 = this.getSheet().getSheetByName('extreme_value');
    var last_row = sheet2.getLastRow(); 
  },
  
  //古いデータを消去
  delOld: function(){
    var sheet = this.getSheet().getActiveSheet();
    sheet.deleteRow(2);
    sheet.getRange(2,10,1,2).clear();
    sheet.getRange(2,9,6,1).clear();
  }
}
