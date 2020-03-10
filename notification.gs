//LINEに通知を送る関数
function notice(info='今がチャンス'){
var CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
var USER_ID = PropertiesService.getScriptProperties().getProperty('USER_ID');
  
  var postData = {
      'to':USER_ID,
      'messages':[{
        'type': 'text',
        'text':info,
      }]
    };
    
    var push_url = 'https://api.line.me/v2/bot/message/push';
    var headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN,
    };
    
    var options = {
      'method': 'post',
      'headers': headers,
      'payload':JSON.stringify(postData),
      'muteHttpExceptions': true
    };
    
    var response = UrlFetchApp.fetch(push_url, options); 
  }

//各足でボリンジャーバンドに触れた時に通知する
function noticeBB(pair){
    var mysheet = getSheets().getSheetByName('data_1m');
    var pairs = ["GBP","USD","EUR"];
    var last_row = mysheet.getLastRow(); 
    var pair_n = pairs.indexOf(pair);
    var now_trade = mysheet.getRange(last_row, pair_n+2).getValue();
    var past_trade = mysheet.getRange(last_row-1, pair_n+2).getValue();
    var percent = 0;
    var past_percent = 0;

    mysheet = getSheets().getSheetByName(pair+'_30m');
    var bb = new BB(mysheet);
    past_percent = (past_trade-bb.MA)/(bb.Up-bb.MA)
    percent = (now_trade-bb.MA)/(bb.Up-bb.MA)
    past_percent *= 100;
    percent *= 100;
    if(past_percent<66 && percent>=66){
        notice('30分足ボリンジャーバンドで売りのチャンス！！');
    }if(past_percent>-66 && percent<=-66){
        notice('30分足ボリンジャーバンドで買いのチャンス！！');
    }

    mysheet = getSheets().getSheetByName(pair+'_4h');
    var bb = new BB(mysheet);
    past_percent = (past_trade-bb.MA)/(bb.Up-bb.MA)
    percent = (now_trade-bb.MA)/(bb.Up-bb.MA)
    past_percent *= 100;
    percent *= 100;
    if(past_percent<66 && percent>=66){
        notice('4時間足ボリンジャーバンドで売りのチャンス！！');
    }if(past_percent>-66 && percent<=-66){
        notice('4時間足ボリンジャーバンドで買いのチャンス！！');
    }

    /*
    mysheet = getSheets().getSheetByName(pair+'_1d');
    var bb = new BB(mysheet);
    past_percent = (past_trade-bb.MA)/(bb.Up-bb.MA)
    percent = (now_trade-bb.MA)/(bb.Up-bb.MA)
    past_percent *= 100;
    percent *= 100;
    Logger.log(past_percent);
    Logger.log(percent);
    if(past_percent<85 && percent>=85){
        notice('日足ボリンジャーバンドで売りのチャンス！！');
    }if(past_percent>-85 && percent<=-85){
        notice('日足ボリンジャーバンドで買いのチャンス！！');
    }
    */
}

function noticeSharp(pair){
    var mysheet = getSheets().getSheetByName('data_1m');
    var pairs = ["GBP","USD","EUR"];
    var last_row = mysheet.getLastRow(); 
    var pair_n = pairs.indexOf(pair);
    var now_trade = mysheet.getRange(last_row, pair_n+2).getValue();
    var past_trade = mysheet.getRange(last_row-1, pair_n+2).getValue();
    if(past_trade-now_trade>=0.5){
        notice(pair+'が急下落');
    }if(past_trade-now_trade<=-0.5){
        notice(pair+'が急上昇');
    }
}