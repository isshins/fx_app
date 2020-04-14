//通知関数まとめ
function noticeAny(pair){
    noticeBB(pair);
    noticeOrder();
    noticeGoal();
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

//五分足で急激な変化(20pips)が生じた際に通知
function noticeSharp(pair){
    var mysheet = getSheets().getSheetByName(pair+'_5m');
    var last_row = mysheet.getLastRow(); 
    var open = mysheet.getRange(last_row, 4).getValue();
    var end = mysheet.getRange(last_row, 5).getValue();
    if(open-end>=0.2){
        notice(pair+'が急下落');
    }if(end-open>=0.2){
        notice(pair+'が急上昇');
    }
}

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
    if(sheet.getRange(last_row,2).getValue() == 'trading'){
        var now_trade = getNow();
        var stop_order = sheet.getRange(last_row,5).getValue();
        var limit_order = sheet.getRange(last_row,6).getValue();
        var finish = sheet.getRange(last_row,7);
        var tradetype = sheet.getRange(last_row,3).getValue();
        if(tradetype == '買い'){
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
         }if(tradetype == '売り'){
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
  var state = sheet.getRange(last_row,2);
  var stock = sheet.getRange(1,1).getValue();
  if(events[0].type=="message"){                 ///textに対する反応
      var post_text = events[0].message.text;
      var stop = sheet.getRange(last_row,5);
      var limit = sheet.getRange(last_row,6);
      var order = sheet.getRange(last_row,4).getValue();
      var now_trade = getNow();
      var tradetype = sheet.getRange(last_row,3).getValue();
      if(post_text.indexOf('.') != -1){
          sheet.getRange(1,1).setValue(post_text);
          stock = sheet.getRange(1,1).getValue();
          if(state.getValue()=='trading' || state.getValue()=='completed'){
              if(Math.abs(now_trade-stock)<0.3){
                  choiceAction(state.getValue());
                  return;
              }else{
                  notice('現在の相場とかけ離れてる値です');
                  return;
              }
          }if(stop.isBlank()){
              if((tradetype == '買い' && order > stock) 
              || (tradetype == '売り' && order < stock)){
                  stop.setValue(stock);
                  notice(stock+'で損切り('+(((Math.abs(stock-order)*-100)+1.3)*500).toFixed(0)+'円)\n利確ポイントを入力してください');
                  return;
              }else{
                  notice('損切位置がおかしいです\n正しい損切り位置を入力してください');
                  return;
              }
          }if(stop.getValue()!=null && limit.isBlank()){
              if((tradetype == '買い' && order < stock) 
              || (tradetype == '売り' && order > stock)){
                  limit.setValue(stock);
                  notice(stock+'で利確('+(((Math.abs(stock-order)*100)+1.3)).toFixed(1)+'pips)');
                  state.setValue('trading');
                  return;
              }else{
                  notice('利得位置がおかしいです\n正しい利確位置を入力してください');
                  return;
              }
          }
      }if(post_text.indexOf('pips') != -1 && state.getValue()=='trading'){
          if(tradetype == '買い'){
              var buypips = (((now_trade-order)*100)-1.3).toFixed(1);
              if(buypips>0){
                  notice(buypips+'pips勝っています\n+'+(buypips*500)+'円');
              }if(buypips<0){
                  notice(buypips+'pips負けています\n'+(buypips*500)+'円');
              }
          }if(tradetype == '売り'){
              var sellpips = (((order-now_trade)*100)-1.3).toFixed(1);
              if(sellpips>0){
                  notice(sellpips+'pips勝っています\n+'+(sellpips*500)+'円');
              }if(sellpips<0){
                  notice(sellpips+'pips負けています\n'+(sellpips*500)+'円');
              }
          }
      }if(post_text.indexOf('なし') != -1){
          if(stop.isBlank()){
              stop.setValue('なし');
              notice('損切はなし');
              return;
          }if(stop!=null && limit.isBlank()){
              limit.setValue('なし');
              state.setValue('trading');
              notice('利確はなし');
              return;
          }
      } 
  }else if(events[0].type=="postback"){     ///ボタンによるpostbackに対する反応
      var data = events[0].postback.data;
      if('notice goal' == data){
          sheet.getRange(1,3).setValue(stock);
      }
      if(state.getValue() == 'completed'){
          if('buy order' == data){      
              sheet.appendRow([now,null,'買い',stock]);
              notice(stock+'で買い\n損切ポイントを入力してください');
          }else if('sell order' == data){
              sheet.appendRow([now,null,'売り',stock]);
              notice(stock+'で売り\n損切ポイントを入力してください');
          }
      }else{
          if('close order' == data){
              var finish = sheet.getRange(last_row,7);
              var profit = sheet.getRange(last_row,9).getValue();
              finish.setValue(stock);
              takeProfit();
              return;
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
					    "altText": "postback",
					    "template": {
						    "type": "buttons",
						    "title": "メニュー",
						    "text": "以下より選択してください。",
						    "actions": [
                                {
								    "type": "postback",
								    "label": "買い注文",
								    "data": "buy order"
							    },
							    {
								    "type": "postback",
								    "label": "売り注文",
								    "data": "sell order"
							    },
                                {
								    "type": "postback",
								    "label": "通知",
								    "data": "notice"
							    }
						    ]
					    }
				    }
			    ],
			    "notificationDisabled": false // trueだとユーザーに通知されない
		    }),
	    });
    }if(state =='trading'){
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
					    "altText": "postback",
					    "template": {
						    "type": "buttons",
						    "title": "メニュー",
						    "text": "以下より選択してください。",
						    "actions": [
                                {
								    "type": "postback",
								    "label": "決済",
								    "data": "close order"
							    },
                                {
								    "type": "postback",
								    "label": "通知",
								    "data": "notice goal"
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

function noticeGoal(){
    var sheet = getSheets().getSheetByName('本番帳簿');
    var now = getNow();
    var goal = sheet.getRange(1,3).getValue();
    if(sheet.getRange(1,3).isBlank()==false){
        if(Math.abs(now-goal)<0.05){
            notice(goal+'まであと5pip以内');
            sheet.getRange(1,3).clear();
        }else if(Math.abs(now-goal)<0.1){
            notice(goal+'まであと10pip以内');
        }
    }
    
}

function takeProfit(){
    var sheet = getSheets().getSheetByName('本番帳簿');
    var last_row = sheet.getLastRow();
    var data = sheet.getRange(last_row, 1,1,9).getValues();
    var pips = sheet.getRange(last_row,8)
    var profit = sheet.getRange(last_row,9)
    if(data[0][2]=='買い'){
        var buypips = ((data[0][6]-data[0][3])*100).toFixed(1);
        pips.setValue(buypips);
        profit.setValue(buypips*500);
    }if(data[0][2]=='売り'){
        var sellpips = ((data[0][3]-data[0][6])*100).toFixed(1);
        pips.setValue(sellpips);
        profit.setValue(sellpips*500);
    }
    notice(data[0][6]+'で決済しました\n収支は'+profit.getValue()+'円です');
    sheet.getRange(last_row,2).setValue('completed');  
}