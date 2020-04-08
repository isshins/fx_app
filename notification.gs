//通知関数まとめ
function noticeAny(pair){
    noticeBB(pair);
    //noticeSharp(pair);
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

/*急激な変化(50pips)が生じた際に通知
function noticeSharp(pair){
    var mysheet = getSheets().getSheetByName('data_1m');
    var pairs = ["GBP","USD","EUR"];
    var last_row = mysheet.getLastRow(); 
    var pair_n = pairs.indexOf(pair);
    var now_trade = mysheet.getRange(last_row, pair_n+2).getValue();
    var past_trade = mysheet.getRange(last_row-1, pair_n+2).getValue();
    Logger.log(past_trade-now_trade)
    if(past_trade-now_trade>=0.5){
        notice(pair+'が急下落');
    }if(now_trade-past_trade>=0.5){
        notice(pair+'が急上昇');
    }
}*/

//RSIで上下30%に触れた時に通知
function noticeRSI(pair_time){
    var mysheet = getSheets().getSheetByName(pair_time);
    var last_row = mysheet.getLastRow(); 
    var now_RSI = mysheet.getRange(last_row, 9).getValue();
    var past_RSI = mysheet.getRange(last_row-1, 9).getValue();
    
    if(now_RSI>=80 && past_RSI<80){
        notice(pair_time + 'でRSIで売りのチャンス');
    }if(now_RSI<=20 && past_RSI>20){
        notice(pair_time + 'でRSIで買いのチャンス');
    }
}

//LINEに記録した損切、利確ポイントに触れた時に通知する
function noticeOrder(){
    var sheet = getSheets().getSheetByName('本番帳簿');
    var last_row = sheet.getLastRow();
    var now_trade = getNow();
    var stop_order = sheet.getRange(last_row,5).getValue();
    var limit_order = sheet.getRange(last_row,6).getValue();
    var finish = sheet.getRange(last_row,7);
    if(sheet.getRange(last_row,2).getValue() == 'trading'){
        if(sheet.getRange(last_row,3).getValue() == '買い'){
            if(stop_order!='なし'){
                if(stop_order>=now_trade){
                    notice('損切ポイントを超えました');
                    finish.setValue(stop_order);
                    takeProfit();
                }
            }if(limit_order!='なし'){
                if(limit_order<=now_trade){
                    notice('利得ポイントに到達しました');
                    finish.setValue(limit_order);
                    takeProfit();
                }
            }
         }else if(sheet.getRange(last_row,3).getValue() == '売り'){
            if(stop_order!='なし'){
                if(stop_order<=now_trade){
                    notice('損切ポイントを超えました');
                    finish.setValue(stop_order);
                    takeProfit();
                }
            }if(limit_order!='なし'){
                if(limit_order>=now_trade){
                    notice('利得ポイントに到達しました');
                    finish.setValue(limit_order);
                    takeProfit();
                }
            }
        }
    }
}

//LINEに投稿された文字列に反応する関数
function doPost(e) {
  var sheet = getSheets().getSheetByName('本番帳簿');
  var last_row = sheet.getLastRow();
  var channel_access_token = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  var events = JSON.parse(e.postData.contents).events;
  var now = new Date();
  var state = sheet.getRange(last_row,2).getValue();
  if(events[0].message.type=="text"){
      var post_text = events[0].message.text;
      if(post_text.indexOf('.') != -1){
          sheet.getRange(1,1).setValue(post_text);
          var stock = sheet.getRange(1,1).getValue();
          if(state!=null){
              choiceAction(state);     
          }else if(sheet.getRange(last_row,5).getValue()==null){
              var tradetype = sheet.getRange(last_row,3).getValue();
              var order = sheet.getRange(last_row,4).getValue();
              if((tradetype == '買い' && order > stock) 
              || (tradetype == '売り' && order < stock)){
                  sheet.getRange(last_row,5).setValue(stock);
                  notice('損切記録完了しました\n\n利確ポイントを入力してください');
              }else{
                  notice('損切位置がおかしいです\n\n正しい損切り位置を入力してください');
                  return;
              }
          }else if(sheet.getRange(last_row,5).getValue()!=null && sheet.getRange(last_row,6).getValue()==null){
              var tradetype = sheet.getRange(last_row,3).getValue();
              var order = sheet.getRange(last_row,4).getValue();
              if((tradetype == '買い' && order < stock) 
              || (tradetype == '売り' && order > stock)){
                  sheet.getRange(last_row,6).setValue(stock);
                  notice('利確記録完了しました');
                  state.setValue('trading');
              }else{
                  notice('利得位置がおかしいです\n\n正しい損切り位置を入力してください');
                  return;
              }
          }
      }else if(post_text.indexOf('pips') != -1){
      }else if(post_text.indexOf('なし') != 1){
          if(sheet.getRange(last_row,5).getValue()==null){
              sheet.getRange(last_row,5).setValue('なし');
          }else{
              sheet.getRange(last_row,6).setValue('なし');
          }
      } 
  }else if(events[0].message.type=="postback"){
      var data = events[0].postback.data;
      if('notice' == data){
          var now_trade = getNow();
      }
      if(state == 'completed'){
          if('buy order' == data){      
              sheet.appendRow([now,null,'買い',stock]);
              notice('買い注文記録完了しました\n\n損切ポイントを入力してください');
          }else if('sell order' == data){
              sheet.appendRow([now,null,'売り',stock]);
              notice('売り注文記録完了しました\n\n損切ポイントを入力してください');
          }
      }else{
          if('close order' == data){
              sheet.getRange(last_row,7).setValue(stock);
              notice('注文決済記録完了しました');
              takeProfit();
          }
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
function choiceAction(state) {
	/* スクリプトプロパティのオブジェクトを取得 */
  const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  const USER_ID = PropertiesService.getScriptProperties().getProperty('USER_ID');
	/* ボタンテンプレートメッセージを送る(message) */
    if(state =='completed'){
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
								    "type": "postback",
								    "label": "買い注文",
								    "date": "buy order"
							    },
							    {
								    "type": "postback",
								    "label": "売り注文",
								    "text": "sell order"
							    },
                                {
								    "type": "postback",
								    "label": "通知",
								    "text": "notice"
							    }
						    ]
					    }
				    }
			    ],
			    "notificationDisabled": false // trueだとユーザーに通知されない
		    }),
	    });
    }else if(state =='trading'){
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
								    "type": "postback",
								    "label": "決済",
								    "text": "close order"
							    },
                                {
								    "type": "postback",
								    "label": "通知",
								    "text": "notice"
							    }
						    ]
					    }
				    }
			    ],
			    "notificationDisabled": false // trueだとユーザーに通知されない
		    }),
	    });
    }
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