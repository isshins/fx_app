//通知関数まとめ
function noticeAny(){
    noticeOrder();
    noticeGoal(1);
    noticeGoal(2);
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

//各足でボリンジャーバンドに触れた時に通知する（未使用)
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
    
    if(now_RSI>=75 && past_RSI<75){
        notice(pair_time + 'でRSIで売りのチャンス');
    }if(now_RSI<=25 && past_RSI>25){
        notice(pair_time + 'でRSIで買いのチャンス');
    }
}

//LINEに記録した損切、利確ポイントに触れた時に通知する
function noticeOrder(){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var last_row = sheet.getLastRow();
    if(sheet.getRange(last_row,2).getValue() == 'trading'){
        var now_trade = getNow();
        var stop_order = sheet.getRange(last_row,6).getValue();
        var limit_order = sheet.getRange(last_row,7).getValue();
        var finish = sheet.getRange(last_row,8);
        var tradetype = sheet.getRange(last_row,3).getValue();
        if(tradetype == '買い'){
            if(stop_order!='なし'){
                if(stop_order>=now_trade){
                    notice('損切ポイントを超えました');
                    takeProfit(stop_order);
                }
            }if(limit_order!='なし'){
                if(limit_order<=now_trade){
                    notice('利得ポイントに到達しました');
                    takeProfit(limit_order);
                }
            }
         }if(tradetype == '売り'){
            if(stop_order!='なし'){
                if(stop_order<=now_trade){
                    notice('損切ポイントを超えました');
                    takeProfit(stop_order);
                }
            }if(limit_order!='なし'){
                if(limit_order>=now_trade){
                    notice('利得ポイントに到達しました');
                    takeProfit(limit_order);
                }
            }
        }
    }
}

//LINEに投稿された文字列に反応する関数
function doPost(e) {
  var sheet = getSheets().getSheetByName('デモ帳簿');
  var last_row = sheet.getLastRow();
  var channel_access_token = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  var events = JSON.parse(e.postData.contents).events;
  var now = new Date();
  var state = sheet.getRange(last_row,2).getValue();
  var stock = sheet.getRange(1,1).getValue();
  var tradetype = sheet.getRange(last_row,3).getValue();
  if(events[0].type=="message"){                 ///textに対する反応
      var post_text = events[0].message.text;
      var order = sheet.getRange(last_row,5).getValue();
      var lot = sheet.getRange(last_row,4).getValue();
      
      if(post_text.indexOf('\n') != -1 && sheet.getRange(last_row,2).isBlank() != true){
          sheet.getRange(1,1).setValue(post_text);
          choiceAction('words');
          return;
      }if(post_text.indexOf('.') != -1){
          var post = post_text.split('\n');
          sheet.getRange(1,1).setValue(post[0]); //stockに上書き
          stock = sheet.getRange(1,1).getValue();
          if(state=='trading' || state=='completed'){           //選択肢を送信
              choiceAction(state);
              return;
          }if(post.length>1){                                                         //損切、利得、(lot数)を三行で取得
              var lot = 0.5;
              var lot_text = '取引量は0.5lot\n'
              if(post.length>2){
                  lot_text = '取引量は'+post[2]+'lot\n'                                 //lot数の設定
                  sheet.getRange(last_row,4).setValue(post[2]);
                  lot = post[2];
              }
              
              if((tradetype == '買い' && order > post[0])
              || (tradetype == '売り' && order < post[0])){                             //損切ポイントの設定
                  var stop_text = post[0]+'で損切り('+(Math.abs(post[0]-order)*-100).toFixed(1)+'pips)\n';
                  sheet.getRange(last_row,6).setValue(post[0]);
              }else if(post[0].indexOf('なし') != -1){
                  var stop_text = '損切はなし\n'
                  sheet.getRange(last_row,6).setValue('なし');
              }else{
                  notice('損切位置がおかしいです\n正しい損切り位置を入力してください');
                  return;
              }
              
              if((tradetype == '買い' && order < post[1]) 
              || (tradetype == '売り' && order > post[1])){                             //利得ポイントの設定
                  var limit_text = post[1]+'で利確('+(Math.abs(post[1]-order)*100).toFixed(1)+'pips)\n'
                  sheet.getRange(last_row,7).setValue(post[1]);
              }else if(post[1].indexOf('なし') != -1){
                  var limit_text = '利確はなし\n'
                  sheet.getRange(last_row,7).setValue('なし');
              }else{
                  notice('利得位置がおかしいです\n正しい利確位置を入力してください');
                  return;
              }
              
              var send = stop_text+limit_text+lot_text+'で記録しました';
              notice(send);
              sheet.getRange(last_row,2).setValue('trading'); 
            }
            return;
      }if(post_text.indexOf('pip') != -1 && state=='trading'){              //pipを含むテキストを受信したら、pip数と金額を教えてくれる
          var now_trade = getNow();
          if(tradetype == '買い'){
              var buypips = ((now_trade-order)*100).toFixed(1);
              if(buypips>0){
                  notice(buypips+'pips勝っています');
              }if(buypips<0){
                  notice(buypips+'pips負けています');
              }
          }if(tradetype == '売り'){
              var sellpips = ((order-now_trade)*100).toFixed(1);
              if(sellpips>0){
                  notice(sellpips+'pips勝っています');
              }if(sellpips<0){
                  notice(sellpips+'pips負けています');
              }
          }
          return;
      }if(post_text.indexOf('通知') != -1){
          sheet.getRange(1,3).setValue(stock);
          notice('設定完了');
          return;
      }
      if(post_text.indexOf('限度') != -1){
          var value = 200; //デモ用
          //var value = 100; //本番用
          var bound = sheet.getRange(3,16,12,1).getValues();
          var ideal = sheet.getRange(3,14,12,1).getValues();
          var diff = [];
          var index = 0;
          
          for(var i=0; i<bound.length;i++){
              diff.push(Math.abs(value - bound[i][0]));
              index = (diff[index] < diff[i]) ? index : i;
          }
          notice(ideal[index][0]+'lotが適正なlot数です');
          return;
      }
  }if(events[0].type=="postback"){     ///ボタンによるpostbackに対する反応
      var data = events[0].postback.data;
      Logger.log(data);
      if('notice goal' == data){                                                       //目的のレートに到達したら通知
          sheet.getRange(1,3).setValue(stock);
          notice('設定完了');
      }if("entry reason" == data){
              sheet.getRange(last_row, 11).setValue(stock);
              notice('書込完了');
      }if('comment' == data){
              sheet.getRange(last_row, 12).setValue(stock);
              notice('書込完了');
      }
      if(state == 'completed'){
          if('buy order' == data){                                                     //買い注文の設定
              sheet.appendRow([now,null,'買い',0.5,stock]);
              notice(stock+'で買い\n損切ポイントと\n利得ポイントと\nlot数(0.5以外なら)\nを入力してください');
          }if('sell order' == data){                                              //売り注文の設定
              sheet.appendRow([now,null,'売り',0.5,stock]);
              notice(stock+'で売り\n損切ポイントと\n利得ポイントと\nlot数(0.5以外なら)\nを入力してください');
          }
      }else{
          if('close order' == data){                                                    //注文決済の設定
              takeProfit(stock);
              return;
          }if('change stop' == data){                                                    //損切ポイントの変更
              var order = sheet.getRange(last_row,5).getValue();
              var lot = sheet.getRange(last_row,4).getValue();
              if((tradetype == '買い' && order > stock)
              || (tradetype == '売り' && order < stock)){
                  sheet.getRange(last_row,6).setValue(stock);
                  notice(stock+'に損切ポイントを変更しました('+(Math.abs(stock-order)*-100).toFixed(1)+'pips)');
                  return;
              }else{
                  notice('損切位置がおかしいです\n正しい損切り位置を入力してください');
                  return;
              }
          }if('change limit' == data){                                                   //利確ポイントの変更
              var order = sheet.getRange(last_row,5).getValue();
              var lot = sheet.getRange(last_row,4).getValue();
              if((tradetype == '買い' && order < stock) 
              || (tradetype == '売り' && order > stock)){  
                  sheet.getRange(last_row,7).setValue(stock);
                  notice(stock+'に利確ポイントを変更しました('+(Math.abs(stock-order)*100).toFixed(1)+'pips)');
                  return;
              }else{
                  notice('利得位置がおかしいです\n正しい利確位置を入力してください');
                  return;
              }
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
　var sheet = getSheets().getSheetByName('デモ帳簿');
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
								    "data": "notice goal"
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
								    "label": "損切変更",
								    "data": "change stop"
							    },
                                {
								    "type": "postback",
								    "label": "利得変更",
								    "data": "change limit"
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
    }if(state =='words'){
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
								    "label": "エントリー理由",
								    "data": "entry reason"
							    },
                                {
								    "type": "postback",
								    "label": "コメント",
								    "data": "comment"
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

function noticeGoal(ver){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var now = getNow();
    var past = getPast();
    var goal_r = sheet.getRange(1,1+ver*2);
    var goal = goal_r.getValue();
    if(goal_r.isBlank()==false){                             //通り過ぎた場合に通知
        if((goal-now)*(goal-past)<0){
            notice(goal+'を超えました');
            goal_r.clear();
            return;
        }if(Math.abs(now-goal)<0.01 && Math.abs(past-goal)>=0.01){        //1pip以内にいる場合通知
            notice(goal+'まであと1pip以内');
            goal_r.clear();
            return;
        }else if(Math.abs(now-goal)<0.05 && Math.abs(past-goal)>=0.05){   //5pips以内にいる場合通知
            notice(goal+'まであと5pip以内');
        }
    }
}

function takeProfit(finish){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var last_row = sheet.getLastRow();
    var data = (sheet.getRange(last_row, 1,1,10).getValues())[0];
    var pips = sheet.getRange(last_row,9);
    var profit = sheet.getRange(last_row,10);
    
    sheet.getRange(last_row,8).setValue(finish);
    if(data[2]=='買い'){
        var buypips = ((finish-data[4])*100).toFixed(1);
        pips.setValue(buypips);
        profit.setValue((buypips*data[3]*1000).toFixed(0));
    }if(data[2]=='売り'){
        var sellpips = ((data[4]-finish)*100).toFixed(1);
        pips.setValue(sellpips);
        profit.setValue((sellpips*data[3]*1000).toFixed(0));
    }
    notice(finish+'で決済しました\n収益は'+pips.getValue()+'pipsです');
    sheet.getRange(last_row,2).setValue('completed');  
}