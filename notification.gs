//通知関数まとめ
function noticeAny(){
    noticeOrder();
    tellSignal(1);
    tellSignal(2);
}

//LINEに投稿された文字列に反応する関数
function doPost(e) {
  var sheet = getSheets().getSheetByName('デモ帳簿');
  var last_row = sheet.getLastRow();
  var channel_access_token = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');
  var events = JSON.parse(e.postData.contents).events;
  var state = sheet.getRange(last_row,2).getValue();
  var stock = sheet.getRange(1,1).getValue();
  if(events[0].type=="message"){                 ///textに対する反応
      var post_text = events[0].message.text;

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
          }
          writeDetail(post);                                    //損切、利確、(lot数)を三行で取得
      }if(post_text.indexOf('通知') != -1){
          setSignal(stock);
          return;
      }if(post_text.indexOf('限度') != -1){
          decideLot(post_text);
          return;
      }if(state == 'completed'){
          if(post_text.indexOf('買い') != -1){
              acceptOrder(1,stock);
              return;
          }if(post_text.indexOf('売り') != -1){
              acceptOrder(-1,stock);
              return;
          }
      }if(state=='trading'){
          if(post_text.indexOf('決済') != -1){
              takeProfit(stock);
              return;
          }if(post_text.indexOf('pip') != -1){              //pipを含むテキストを受信したら、pip数と金額を教えてくれる
              tellPip();
              return;
          }if(post_text.indexOf('損切変更') != -1){
              changePoint(-1,stock);
              return;
          }if(post_text.indexOf('利確変更') != -1){
              changePoint(1,stock);
              return;
          }
      }
  }if(events[0].type=="postback"){     ///ボタンによるpostbackに対する反応
      var data = events[0].postback.data;
      Logger.log(data);
      if('set signal' == data){                                                      //目的のレートに到達したら通知
          setSignal(stock);
      }if("entry reason" == data){
          sheet.getRange(last_row, 11).setValue(stock);
          notice('書込完了');
      }if('comment' == data){
          sheet.getRange(last_row, 12).setValue(stock);
          notice('書込完了');
      }
      if(state == 'completed'){
          if('buy order' == data){                                                     //買い注文の設定
              acceptOrder(1,stock)
          }if('sell order' == data){                                                    //売り注文の設定
              acceptOrder(-1,stock)
          }
      }else{
          if('close order' == data){                                                    //注文決済の設定
              takeProfit(stock);
              return;
          }if('change stop' == data){                                                    //損切ポイントの変更
              changePoint(-1,stock);
          }if('change limit' == data){                                                   //利確ポイントの変更
              changePoint(1,stock);
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
								    "data": "set signal"
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
								    "label": "利確変更",
								    "data": "change limit"
							    },
                                {
								    "type": "postback",
								    "label": "通知",
								    "data": "set signal"
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

//注文を受けて、記録する関数
function acceptOrder(type,position){
var now = new Date();
var sheet = getSheets().getSheetByName('デモ帳簿');
var term = '\n損切ポイントと\n利確ポイントと\nlot数(0.5以外なら)\nを入力してください'
    if(type == 1){
        sheet.appendRow([now,null,'買い',0.5,position]);
        notice(position+'で買い'+term);
    }if(type == -1){
        sheet.appendRow([now,null,'売り',0.5,position]);
        notice(position+'で売り'+term);
    }
}

//注文直後に損切、利確、(lot数)を三行で受け取り、記録する関数
function writeDetail(post){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var last_row = sheet.getLastRow();
    var tradetype = sheet.getRange(last_row,3).getValue();
    var order = sheet.getRange(last_row,5).getValue();

    if(post.length>1){                                                         
        var lot = 0.5;
        var lot_text = '取引量は0.5lot\n'
        if(post.length>2){
            lot_text = '取引量は'+post[2]+'lot\n'                                 //lot数の設定
            sheet.getRange(last_row,4).setValue(post[2]);
            lot = post[2];
        }
              
        if((tradetype == '買い' && order > post[0])
        || (tradetype == '売り' && order < post[0])){                            //損切ポイントの設定
            var stop_pip = (Math.abs(post[0]-order)*-100).toFixed(1);
            var stop_text = post[0]+'で損切り('+stop_pip+'pips)\n';
            var pip_log = post[0]+'\n('+stop_pip+'pips)'
            sheet.getRange(last_row,6).setValue(pip_log);
        }else if(post[0].indexOf('なし') != -1){
            var stop_text = '損切はなし\n'
            sheet.getRange(last_row,6).setValue('なし');
        }else{
            notice('損切位置がおかしいです\n正しい損切り位置を入力してください');
            return;
        } 
        
        if((tradetype == '買い' && order < post[1]) 
        || (tradetype == '売り' && order > post[1])){                             //利確ポイントの設定
            var limit_pip=(Math.abs(post[1]-order)*100).toFixed(1);
            var limit_text = post[1]+'で利確('+limit_pip+'pips)\n'
            var pip_log = post[1]+'\n('+limit_pip+'pips)'
            sheet.getRange(last_row,7).setValue(pip_log);
        }else if(post[1].indexOf('なし') != -1){
            var limit_text = '利確はなし\n'
            sheet.getRange(last_row,7).setValue('なし');
        }else{
            notice('利確位置がおかしいです\n正しい利確位置を入力してください');
            return;
        }
              
        var send = stop_text+limit_text+lot_text+'で記録しました';
        notice(send);
        sheet.getRange(last_row,2).setValue('trading'); 
    }
    return;
}

//決済を記録、通知する関数
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


//五分足で急激な変化(20pips)が生じた際に通知
function noticeSharp(){
    var mysheet = getSheets().getSheetByName('GBP_5m');
    var last_row = mysheet.getLastRow(); 
    var open = mysheet.getRange(last_row, 4).getValue();
    var end = mysheet.getRange(last_row, 5).getValue();
    if(open-end>=0.2){
        notice('GBPが急下落');
    }if(end-open>=0.2){
        notice('GBPが急上昇');
    }
}

//LINEに記録した損切、利確ポイントに触れた時に通知する
function noticeOrder(){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var last_row = sheet.getLastRow();
    if(sheet.getRange(last_row,2).getValue() == 'trading'){
        var now_trade = getNow(0);
        var stop_order = sheet.getRange(last_row,6).getValue().split('\n')[0];
        var limit_order = sheet.getRange(last_row,7).getValue().split('\n')[0];
        var finish = sheet.getRange(last_row,8);
        var tradetype = sheet.getRange(last_row,3).getValue();
        var spread = 0.4;
        if(tradetype == '買い'){
            if(stop_order!='なし'){
                if(stop_order-spread>=now_trade){
                    notice('損切ポイントを超えました');
                    takeProfit(stop_order);
                }
            }if(limit_order!='なし'){
                if(limit_order+spread<=now_trade){
                    notice('利確ポイントに到達しました');
                    takeProfit(limit_order);
                }
            }
         }if(tradetype == '売り'){
            if(stop_order!='なし'){
                if(stop_order+spread<=now_trade){
                    notice('損切ポイントを超えました');
                    takeProfit(stop_order);
                }
            }if(limit_order!='なし'){
                if(limit_order-spread>=now_trade){
                    notice('利確ポイントに到達しました');
                    takeProfit(limit_order);
                }
            }
        }
    }
}

//通知したい値を指定する関数
function setSignal(stock){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var now_trade = getNow(0);
    if(stock<now_trade){
        sheet.getRange(1,3).setValue(stock);
        notice('下限設定完了');
    }if(stock>now_trade){
        sheet.getRange(1,5).setValue(stock);
        notice('上限設定完了');
        }       
}

//指定した値に近づいた時、超えた時に通知する関数
function tellSignal(ver){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var now = getNow(0);
    var past = getPast();
    var goal_r = sheet.getRange(1,1+ver*2);
    var goal = goal_r.getValue();
    if(goal_r.isBlank()==false){                             //通り過ぎた場合に通知
        if((goal-now)*(goal-past)<0){
            if(ver == 1){
                notice('下限の'+goal+'を超えました');
            }if(ver == 2){
                notice('上限の'+goal+'を超えました');
            }
            goal_r.clear();
            return;
        }else if(Math.abs(now-goal)<0.05 && Math.abs(past-goal)>=0.05){   //5pips以内にいる場合通知
            if(ver == 1){
                notice('下限の'+goal+'まであと5pip以内');
            }if(ver == 2){
                notice('上限の'+goal+'まであと5pip以内');
            }
        }
    }
}

//現在の投資額から理想的なlot数を提示してくれる関数
function decideLot(text){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var value = 200; //デモ用
    if(text.indexOf('本番') != -1){
        value = 100; //本番用
    }if(text.indexOf('絶対') != -1){
        value=50;  //ここ一番用
    }
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


//pipを含むテキストを受信したら、現在のpip数を教えてくれる
function tellPip(){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var last_row = sheet.getLastRow();
    var tradetype = sheet.getRange(last_row,3).getValue();
    var order = sheet.getRange(last_row,5).getValue();

    if(tradetype == '買い'){
        var buypips = ((getNow(0)-order)*100).toFixed(1);
        if(buypips>0){
            notice(buypips+'pips勝っています');
        }if(buypips<0){
            notice(buypips+'pips負けています');
        }
    }if(tradetype == '売り'){
        var sellpips = ((order-getNow(0))*100).toFixed(1);
        if(sellpips>0){
            notice(sellpips+'pips勝っています');
        }if(sellpips<0){
            notice(sellpips+'pips負けています');
        }
    }
}

//利確ポイントと損切ポイントの変更
function changePoint(type,stock){
    var sheet = getSheets().getSheetByName('デモ帳簿');
    var last_row = sheet.getLastRow();
    var tradetype = sheet.getRange(last_row,3).getValue();
    var order = sheet.getRange(last_row,5).getValue();
    var lot = sheet.getRange(last_row,4).getValue();
    var pip = (Math.abs(stock-order)*-100).toFixed(1);
    var pip_log;

    if(type == -1){
        pip_log = stock+'\n('+pip+'pips)';

        if((tradetype == '買い' && order > stock)
           || (tradetype == '売り' && order < stock)){
               sheet.getRange(last_row,6).setValue(pip_log);
               notice(stock+'に損切ポイントを変更しました('+pip+'pips)');
               return;
           }else{
               notice('損切位置がおかしいです\n正しい損切り位置を入力してください');
               return;
           }
    }
    if(type == 1){
        pip_log = stock+'\n('+(-pip)+'pips)'
        if((tradetype == '買い' && order < stock) 
           || (tradetype == '売り' && order > stock)){  
               sheet.getRange(last_row,7).setValue(pip_log);
               notice(stock+'に利確ポイントを変更しました('+(-pip)+'pips)');
               return;
           }else{
               notice('利確位置がおかしいです\n正しい利確位置を入力してください');
               return;
           }
    }
}