/*
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
*/

/*
//直近の最高値と最安値を取得
function getEx(){
    var sheet = exchange.getSheet().getActiveSheet();
    var last_row = sheet.getLastRow();
    Logger.log(sheet.getRange(last_row,3,1,2).getValues()[0]);
    return sheet.getRange(last_row,3,1,2).getValues()[0];
}

*/




/*各足でボリンジャーバンドに触れた時に通知する（未使用)
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
}
 */
 
 
/*RSIで上下30%に触れた時に通知
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
*/