//テスト関数
function test(){
   var sheet = getSheets().getSheetByName('デモ帳簿');
   var last_row = sheet.getLastRow();
   var stop_order = sheet.getRange(last_row,6).getValue().split('\n')[0];
   Logger.log(stop_order);


}

//アップロード関数
function update(mySheet){
    var pairs = ["GBPJPY", "USDJPY", "EURJPY"];
    var prices = [new Date()];
    var last_row = mySheet.getLastRow();
    var miss = 0;
    var data = ''
    for(var i=0; i<3; i++){
        data = getData(pairs[i]);
        if(data=='.'){
            prices.push(mySheet.getRange(last_row,i+2).getValue());
            miss = 1;
        }else{
            prices.push(data);
        }
    }
    if(miss==1){
    prices.push('miss');
    }
    mySheet.appendRow(prices);
}

//為替データを取得する関数
function getData(pair) {
    var url = 'https://info.finance.yahoo.co.jp/fx/detail/?code=' +pair+ '=FX';
    var tag = pair + '_detail_bid">';

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
function dataDivide(pair){
    var now = new Date();
    var data = [];
    if(now.getMinutes()%5==0){
        //5分足のローソク足
        var mysheet = getSheets().getSheetByName(pair+'_5m');
        data = addFeature(mysheet,getCandle(pair,5));
        mysheet.appendRow(data);
        noticeSharp(pair);//急変化通知
        delOld(mysheet,5000);
    }
    if(now.getMinutes()==0){
        //1時間足のローソク足
        mysheet = getSheets().getSheetByName(pair+'_1h');
        data = addFeature(mysheet,getCandle(pair,60));
        mysheet.appendRow(data);
        delOld(mysheet,2000);
    }
    if(now.getHours()%4==0 && now.getMinutes()==0){
        //４時間足
        mysheet = getSheets().getSheetByName(pair+'_4h');
        data = addFeature(mysheet,getCandle(pair,240));
        mysheet.appendRow(data);
        delOld(mysheet,2000);
    }
    if(now.getHours()==0 && now.getMinutes()==0){
        //日足
        mysheet = getSheets().getSheetByName(pair+'_1d');
        data = addFeature(mysheet,getCandle(pair,1440));
        mysheet.appendRow(data);
        delOld(mysheet,1000);
    }
}

//与えられた期間での時間,open,end,high,lowを取得
function getCandle(pair,data_num){
    var pairs = ["GBP","USD","EUR"];
    var mysheet = getSheets().getSheetByName('data_1m');
    var array = [];
    var now = new Date();
    var last_row = mysheet.getLastRow();
    var pair_n = pairs.indexOf(pair);
    var data = mysheet.getRange(last_row-data_num, pair_n+2,data_num+1,1).getValues();
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
    //data.push(bb.Up);
    //data.push(bb.Down);
    //data.push(addRSI(mysheet));
    return data;
}


function addRSI(sheet){
    const period = 13;
    var last_row = sheet.getLastRow();
    var diff = 0;
    var plus_diff = 0;
    //13日分のデータが貯まるまで返値を0にする
    if(last_row>period+1){
        var period_row = sheet.getRange(last_row-period, 5, period+1, 1).getValues()
     }else{
        var period_row = [];
        for(i=0;i<period+1;i++){
            period_row.push([0]);
        } 
    }
    
    for(i=0;i<period;i++){
        diff += Math.abs(period_row[i+1][0]-period_row[i][0]);
        if(period_row[i+1][0]-period_row[i][0]>0){
            plus_diff += period_row[i+1][0]-period_row[i][0];
        }
    }
    diff /= period;
    plus_diff /= period;
    return plus_diff/diff*100;
}

//古いデータを消去
function delOld(sheet,limit){
    var diff = sheet.getLastRow()-limit;
    Logger.log(diff);
    if(diff>0){
        sheet.deleteRows(2,diff);
    }
}


//直近の買値と売値を取得
function getNow(){
    var sheet = getSheets().getSheetByName('data_1m');
    var last_row = sheet.getLastRow();
    var now_trade = sheet.getRange(last_row,2).getValue();
    if(now_trade == '0' || now_trade == '.'){
        getNow();
        Logger.log('getNow() is missing');
    }
    return now_trade;
}

//直近の買値と売値を取得
function getPast(){
    var sheet = getSheets().getSheetByName('data_1m');
    var last_row = sheet.getLastRow();
    var past_trade = sheet.getRange(last_row-1,2).getValue();
    if(past_trade == '0' || past_trade == '.'){
        getPast();
        Logger.log('getPast() is missing');
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

