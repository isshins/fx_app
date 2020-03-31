//通知関数まとめ
function noticeAny(pair){
    noticeBB(pair);
    noticeSharp(pair);
    noticeOrder()
}

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
    bb = new BB(mysheet);
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

//急激な変化(50pips)が生じた際に通知
function noticeSharp(pair){
    var mysheet = getSheets().getSheetByName('data_1m');
    var pairs = ["GBP","USD","EUR"];
    var last_row = mysheet.getLastRow(); 
    var pair_n = pairs.indexOf(pair);
    var now_trade = mysheet.getRange(last_row, pair_n+2).getValue();
    var past_trade = mysheet.getRange(last_row-1, pair_n+2).getValue();
    if(past_trade-now_trade>=0.5){
        notice(pair+'が急下落');
    }if(now_trade-past_trade>=0.5){
        notice(pair+'が急上昇');
    }
}

//RSIで上下30%に触れた時に通知
function noticeRSI(pair){
    var mysheet = getSheets().getSheetByName(pair+'_30m');
    var last_row = mysheet.getLastRow(); 
    var now_RSI = mysheet.getRange(last_row, 9).getValue();
    var past_RSI = mysheet.getRange(last_row-1, 9).getValue();
    
    if(now_RSI>=70 && past_RSI<70){
        notice('RSIで売りのチャンス');
    }if(now_RSI<=30 && past_RSI>30){
        notice('RSIで買いのチャンス');
    }
}

//LINEに記録した損切、利確ポイントに触れた時に通知する
function noticeOrder(){
    var sheet1 = getSheets().getSheetByName('data_1m');
    var sheet2 = getSheets().getSheetByName('本番帳簿');
    var last_row = sheet1.getLastRow();
    var now_trade = sheet1.getRange(last_row,2).getValue();
    last_row = sheet2.getLastRow();
    var stop_order = sheet2.getRange(last_row,5).getValue();
    var limit_order = sheet2.getRange(last_row,6).getValue()
    if(sheet2.getRange(last_row,2).getValue() != 'completed'){
        if(sheet2.getRange(last_row,3).getValue() == '買い'){
            if(stop_order>=now_trade){
                notice('損切ポイントを超えました');
                sheet2.getRange(last_row,7).setValue(stop_order);
            }else if(limit_order<=now_trade){
                notice('利得ポイントに到達しました');
                sheet2.getRange(last_row,7).setValue(limit_order);
            }
        }else if(sheet2.getRange(last_row,3).getValue() == '売り'){
            if(stop_order<=now_trade){
                notice('損切ポイントを超えました');
                sheet2.getRange(last_row,7).setValue(stop_order);
            }else if(limit_order>=now_trade){
                notice('利得ポイントに到達しました');
                sheet2.getRange(last_row,7).setValue(limit_order);
            }
        }
        takeProfit();
    }
}

//LINEに投稿された文字列に反応する関数
function doPost(e) {
  var sheet = getSheets().getSheetByName('本番帳簿');
  var last_row = sheet.getLastRow();
  var stock = sheet.getRange(1,1).getValue();
 
  var channel_access_token = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  var events = JSON.parse(e.postData.contents).events;
  if(events[0].message.type=="text"){
      var post_text = events[0].message.text;
  }else{
      return;
  }
  if(post_text.indexOf('.') != -1){
      choiceAction();
      sheet.getRange(1,1).setValue(post_text);
  }else if('buy order' == post_text){
      var now = new Date();
      sheet.appendRow([now,null,'買い',stock]);
      notice('買い注文記録完了');
  }else if('sell order' == post_text){
      var now = new Date();
      sheet.appendRow([now,null,'売り',stock]);
      notice('売り注文記録完了');
  }else if('stop order' == post_text){
      var tradetype = sheet.getRange(last_row,3).getValue();
      var order = sheet.getRange(last_row,4).getValue();
      if((tradetype == '買い' && order > stock) 
      || (tradetype == '売り' && order < stock)){
          sheet.getRange(last_row,5).setValue(stock);
          notice('損切記録完了');
      }else{
          notice('損切位置がおかしいです');
          return;
      }
  }else if('limit order' == post_text){
      var tradetype = sheet.getRange(last_row,3).getValue();
      var order = sheet.getRange(last_row,4).getValue();
      if((tradetype == '買い' && order < stock) 
      || (tradetype == '売り' && order > stock)){
          sheet.getRange(last_row,6).setValue(stock);
          notice('利確記録完了');
      }else{
          notice('利得位置がおかしいです');
          return;
      }
      
  }
  
  /*　オウム返し
  events.forEach(function(event) {
    if(event.type == "message") {
      reply(event);
      }
    }
  );
  */
}
 //オウム返し関数
function reply(e) {
　var sheet = getSheets().getSheetByName('本番帳簿');
  const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  var message = {
    "replyToken" : e.replyToken,
    "messages" : [
      {
        "type" : "text",
        "text" : ((e.message.type=="text") ? e.message.text : "Text以外は返せません・・・")
      }
    ]
  };
 
  var replyData = {
    "method" : "post",
    "headers" : {
      "Content-Type" : "application/json",
      "Authorization" : "Bearer " + CHANNEL_ACCESS_TOKEN,
    },
    "payload" : JSON.stringify(message)
  };
  var response = UrlFetchApp.fetch("https://api.line.me/v2/bot/message/reply", replyData);
  return response.getResponseCode();
}

//選択肢を表示させる関数
function choiceAction() {
	/* スクリプトプロパティのオブジェクトを取得 */
  const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  const USER_ID = PropertiesService.getScriptProperties().getProperty('USER_ID');
	/* ボタンテンプレートメッセージを送る(message) */
	UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
		'headers': {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + CHANNEL_ACCESS_TOKEN, // スクリプトプロパティにトークンは事前に追加しておく
		},
		'method': 'POST',
		'payload': JSON.stringify({
			"to": USER_ID, // スクリプトプロパティに送信先IDは事前に追加しておく
			"messages": [
				{
					"type": "template",
					"altText": "message",
					"template": {
						"type": "buttons",
						
						"title": "メニュー",
						"text": "以下より選択してください。",
						
						"actions": [
                            {
								"type": "message",
								"label": "買い注文",
								"text": "buy order"
							},
							{
								"type": "message",
								"label": "売り注文",
								"text": "sell order"
							},
							{
								"type": "message",
								"label": "損切",
								"text": "stop order"
							},
                            {
								"type": "message",
								"label": "利確",
								"text": "limit order"
							}
						]
					}
				}
			],
			"notificationDisabled": false // trueだとユーザーに通知されない
		}),
	});
}

function takeProfit(){
    var sheet = getSheets().getSheetByName('本番帳簿');
    var last_row = sheet.getLastRow();
    var data = sheet.getRange(last_row, 1,1,9).getValues();
    sheet.getRange(last_row,8).setValue((data[0][6]-data[0][3])*100)
    sheet.getRange(last_row,9).setValue((data[0][6]-data[0][3])*100*500)
    sheet.getRange(last_row,2).setValue('completed');
    Logger.log('clear');
    
}