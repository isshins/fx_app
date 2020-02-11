//テスト関数
function test(){
    var now =new Date();
    var mysheet = exchange.getSheet().getSheetByName('data_1m');
    dataDivide('GBP');
}

//アップロード関数
function update(mySheet){
    var pairs = ["GBPJPY", "USDJPY", "EURJPY"];
    var prices = [new Date()];
    var last_row = mySheet.getLastRow();

    for(var i=0; i<3; i++){
        prices.push(getData(pairs[i]));
    }
    mySheet.appendRow(prices);
}

//取得する関数
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
        delOld(mysheet,5000);
    }
    if(now.getMinutes()%30==0){
        //30分足のローソク足
        mysheet = getSheets().getSheetByName(pair+'_30m');
        data = addFeature(mysheet,getCandle(pair,30));
        mysheet.appendRow(data);
        delOld(mysheet,5000);
    }
    if(now.getHours()%4==0 && now.getMinutes()==0){
        //４時間足
        mysheet = getSheets().getSheetByName(pair+'_4h')
        data = addFeature(mysheet,getCandle(pair,240));
        mysheet.appendRow(data);
        delOld(mysheet,5000);
    }
    if(now.getHours()==0 && now.getMinutes()==0){
        //日足
        mysheet = getSheets().getSheetByName(pair+'_1d');
        data = addFeature(mysheet,getCandle(pair,1440));
        mysheet.appendRow(data);
        delOld(mysheet,5000);
    }
}

//与えられた期間でのopen,end,high,lowを取得
function getCandle(pair,data_num){
    var pairs = ["GBP","USD","EUR"];
    var mysheet = getSheets().getSheetByName('data_1m');
    var array = [];
    var now = new Date();
    var last_row = mysheet.getLastRow();
    var pair_n = pairs.indexOf(pair);
    var data = mysheet.getRange(last_row-data_num+1, pair_n+2,data_num,1).getValues();
    Logger.log(data);
    for(i=0; i<data_num; i++){
        array.push(data[i][0]);
    }
    Logger.log(array);
    return [now,Math.max.apply(null,array),Math.min.apply(null,array), array[0], array[data_num-1]];
}

//特徴量を加える
function addFeature(mysheet,data){
    data.push(getBB(mysheet,0));
    data.push(getBB(mysheet,1));
    data.push(getBB(mysheet,-1));
    data.push(getBB(mysheet,2));
    return data;
}

//トレンド判断の書き込み
function addAttribute(sheet){
    //var sheet2 = exchange.getSheet().getSheetByName('data_1day');
    var last_row = sheet.getLastRow();
    sheet.getRange(last_row, 8).setValue(getBB(sheet,0));
    sheet.getRange(last_row,9).setValue(getBB(sheet,1));
    sheet.getRange(last_row,10).setValue(getBB(sheet,-1));
    sheet.getRange(last_row,11).setValue(getBB(sheet,2));
}

//古いデータを消去
function delOld(sheet,limit){
    if(sheet.getLastRow()>limit){
        sheet.deleteRow(2);
    }
}


//単純移動平均線とボリンジャーバンド
function getBB(sheet,mode){
    var space = 20;
    var v_rate = 3 
    var last_row = sheet.getLastRow();
    var sum = 0;
    var variance = 0;
    var ema = 0;

    if(last_row>21){
    var space_row = sheet.getRange(last_row-(space-1), 5, space, 1).getValues();
    
        for(i=0;i<space;i++){                            //modeが0の時には単純移動平均線を出力
            sum+=space_row[i][0];
        }
        ema=sum/space;


        if(mode>0){                                      //modeが1以上の時には上のボリンジャーバンドを出力
            for(i=0; i<space; i++){
                variance+=Math.pow(ema-space_row[i][0],2);
            }
            variance=variance/(space-1);
            var std=Math.sqrt(variance);
            if(mode==2){                                 //modeが2の時にはボリンジャーバンドの際を100%、EMAを0％とした時の現在の終値の割合を出力
                return ((space_row[space-1][0]-ema)/(v_rate*std))*100;  
            }
            return ema+v_rate*std;

        }

        if(mode<0){                                      //modeが-1以下の時には下のボリンジャーバンドを出力
            for(i=0; i<space; i++){
                variance+=Math.pow(ema-space_row[i][0],2);
            }
            variance=variance/(space-1);
            var std=Math.sqrt(variance);
            return ema-v_rate*std;
        }
    }
    return ema;
}


//極値の更新
function updateExtreme(){
    var now = new Date();
    var life_span = 6;
    var ss  = exchange.getSheet()
    var sheet = ss.getSheetByName('extreme_value');
    var last_row = sheet.getLastRow();
    var update = sheet.getRange(last_row-1,1,1,5);
    var upd_val = update.getValues()[0];
    var values = [0,0,0,0,0];
    var position = getNow();//現在の買値と売値

    //寿命が先に切れた時
    if(upd_val[1]<0){
        values = [[now,life_span,upd_val[2],position[1-upd_val[2]],0]];
        update.setValues(values);
    }
    //寿命切れ
    if(upd_val[1]==0){
        //次なる極値を追加
        values = [[now,life_span,upd_val[2],position[1-upd_val[2]],[0]]];
        sheet.getRange(last_row+1,1,1,5).setValues(values);
        //極値を確定,前の極値と比較
        var past_extreme = sheet.getRange(last_row-4,4).getValue();
        values = [[upd_val[0],'done',upd_val[2],upd_val[3],[upd_val[3]-past_extreme]]];
        sheet.getRange(last_row-2,1,1,5).setValues(values);
        update = sheet.getRange(last_row-1,1,1,5);
        upd_val = update.getValues()[0];
    }

    for(i=0; i<2; i++){
        //最高値の更新
        if(upd_val[2]==1){
            if(upd_val[3]<position[0]){
                values=[[now,life_span,upd_val[2],position[0],[0]]]
                update.setValues(values)
            }else{
                sheet.getRange(last_row-1+i,2).setValue(upd_val[2]-1);//寿命経過
            }
        }
        //最安値の更新
        if(upd_val[2]==0){
            if(upd_val[3]>position[1]){
                values=[[now,life_span,upd_val[2],position[1],[0]]]
                update.setValues(values)
            }else{
                sheet.getRange(last_row-1+i,2).setValue(upd_val[2]-1);//寿命経過
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


//直近の買値と売値を取得
function getNow(){
    var sheet = exchange.getSheet().getActiveSheet();
    var last_row = sheet.getLastRow();
    var now_trade = sheet.getRange(last_row,5).getValues()[0];
    Logger.log(now_trade);
    return now_trade;
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

//シートを与える関数
function getSheets(){
    var SHEET_URL = PropertiesService.getScriptProperties().getProperty('SHEET_URL');
    if (!SHEET_URL) {
        throw 'You should set "SHEET_URL" property from [File] > [Project properties] > [Script properties]';
    }
    var sheets = SpreadsheetApp.openByUrl(SHEET_URL);
    return sheets;
}

