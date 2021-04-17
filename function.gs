//テスト関数
function test(){
   var sheet = getSheets().getSheetByName('test');
   var last_row = sheet.getLastRow();
   var stop_order = sheet.getRange(last_row,6).getValue().split('\n')[0];
   testupdate(sheet)
   delOld(sheet,2000)
}

//アップロード関数
function update(mySheet){
    var prices = [new Date()];
    var last_row = mySheet.getLastRow();
    var miss = -1;
    var data = '';
    for(var i=0; i<2; i++){
        data = getData('GBPJPY',i);
        if(data=='.'){
            //ptices.push(mySheet.getRange(last_row,i+2).getValue())
            prices.push(getData('GBPJPY',i));
            miss = i;
        }else{
            prices.push(data);
        }
    }
    prices.push(prices[2]-prices[1])
    if(miss>=0){
        prices.push('miss');
        prices.push(getData('GBPJPY',miss));
    }
    mySheet.appendRow(prices);
}

//修正版アップデート関数
function testupdate(mySheet){
    var prices = [new Date()];
    var last_row = mySheet.getLastRow();
    var miss = -1;
    var data = '';
    for(var i=0; i<2; i++){
        data = getData('GBPJPY',i);
        if(data=='.'){
            prices.push(getData('GBPJPY',i));
            miss = i;
        }else{
            prices.push(data);
        }
    }
    prices.push(prices[2]-prices[1])
    if(miss>=0){
        prices.push('miss');
        prices.push(getData('GBPJPY',i));
    }
    mySheet.appendRow(prices);
}

//為替データを取得する関数
function getData(pair,ver) {
    var url = 'https://info.finance.yahoo.co.jp/fx/detail/?code=' +pair+ '=FX';
    switch(ver){
        case 0:
            var tag = pair + '_detail_bid">';
            break;
        case 1:
            var tag = pair + '_detail_ask">';
            break;
    }

    var response = UrlFetchApp.fetch(url); 
    var html = response.getContentText();
    var index = html.indexOf(tag);
    price = "";
    if (index !== -1) {
        var html = html.substring(index + tag.length);
        var index = html.indexOf('</dd>');
        if (index !== -1) {
            html = html.substring(0, index);
            html = html.replace('<span class="large">',"")
            price = html.replace('</span>',"")
        }
    }
    return price;
}


//1分足の元データからそれぞれの時間足のシート作成
function dataDivide(){
    var now = new Date();
    var data = [];
    if(now.getMinutes()%5==0){
        //5分足のローソク足
        var mysheet = getSheets().getSheetByName('GBP_5m');
        data = addFeature(mysheet,getCandle(5));
        mysheet.appendRow(data);
        noticeSharp();//急変化通知
        delOld(mysheet,10000);
    }
    if(now.getMinutes()%30==0){
        //30分足のローソク足
        mysheet = getSheets().getSheetByName('GBP_30m');
        data = addFeature(mysheet,getCandle(30));
        mysheet.appendRow(data);
        delOld(mysheet,10000);
    }
    if(now.getMinutes()==0){
        //1時間足のローソク足
        mysheet = getSheets().getSheetByName('GBP_1h');
        data = addFeature(mysheet,getCandle(60));
        mysheet.appendRow(data);
        delOld(mysheet,10000);
    }
    if(now.getHours()%4==0 && now.getMinutes()==0){
        //４時間足
        mysheet = getSheets().getSheetByName('GBP_4h');
        data = addFeature(mysheet,getCandle(240));
        mysheet.appendRow(data);
        delOld(mysheet,10000);
    }
    if(now.getHours()==0 && now.getMinutes()==0){
        //日足
        mysheet = getSheets().getSheetByName('GBP_1d');
        data = addFeature(mysheet,getCandle(1440));
        mysheet.appendRow(data);
        delOld(mysheet,10000);
    }
}

//与えられた期間での時間,open,end,high,lowを取得
function getCandle(data_num){
    var mysheet = getSheets().getSheetByName('data_1m');
    var array = [];
    var now = new Date();
    var last_row = mysheet.getLastRow();
    var data = mysheet.getRange(last_row-data_num,2,data_num+1,1).getValues();
    for(i=1; i<data_num+1; i++){
        if(data[i][0] == '.'){
        array.push(data[i-1][0]);
        }else{
        array.push(data[i][0]);
        }
    }
    if(data_num==1440){
        var now = Date.now();
        var past = new Date(now-60000*data_num);
        return [past,Math.max.apply(null,array),Math.min.apply(null,array), data[0][0], array[data_num-1]]; 
    }else{
        return [now,Math.max.apply(null,array),Math.min.apply(null,array), data[0][0], array[data_num-1]];
    }
}

//特徴量を加える(200MAとその傾きとトレンド判断)
function addFeature(mysheet,data){
    var ind = new Indicator(mysheet);
    data.push(ind.MA);
    data.push(ind.grad);
    data.push(ind.trend);
    return data;
}


//古いデータを消去
function delOld(sheet,limit){
    var diff = sheet.getLastRow()-limit;
    Logger.log(diff);
    if(diff>0){
        sheet.deleteRows(2,diff);
    }
}


//現在の買値と売値を取得
function getNow(ver){
    var sheet = getSheets().getSheetByName('data_1m');
    var last_row = sheet.getLastRow();
    var now_trade = sheet.getRange(last_row,2+ver).getValue();//０はBid(売値),1はAsk(買値),２はスプレッド

    if(now_trade == '0' || now_trade == '.'){
        Logger.log('getNow() is missing');
        now_trade = sheet.getRange(last_row-1,2).getValue();
    }
    return now_trade;
}

//直前の買値と売値を取得
function getPast(ver){
    var sheet = getSheets().getSheetByName('data_1m');
    var last_row = sheet.getLastRow();
    var now_trade = sheet.getRange(last_row-1,2+ver).getValue();//０はBid(売値),1はAsk(買値),２はスプレッド
    
    if(past_trade == '0' || past_trade == '.'){
        Logger.log('getPast() is missing');
        past_trade = sheet.getRange(last_row-2,2).getValue();
    }
    return past_trade;
}

//土曜日6:50~月曜日6:59のスクレイピング停止
function stopScrape(date){
    var stop = 0;
    var now = date;
    if(now.getDay()==6 && now.getHours()>=6){
        stop = 1;
    }
    //if(now.getDay()==6 && now.getHours()==6 && now.getMinutes()<50){
   //     stop = 0;
  //  } 
    if(now.getDay()==0 || now.getDay()==1 && now.getHours()<=6){
        stop = 1;
    }
    return stop;
}

//シートを与える関数
function getSheets(){
    var SHEET_URL = PropertiesService.getScriptProperties().getProperty('SHEET_URL');
    if (!SHEET_URL) {
        throw 'You should set "SHEET_URL" property from [File] > [Project properties] > [Script properties]';
    }
    var sheets = SpreadsheetApp.openByUrl(SHEET_URL);
    return sheets;
}

