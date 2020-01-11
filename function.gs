//テスト関数
function test(){
 var sheet = exchange.getSheet().getActiveSheet();
Logger.log(getEma(sheet));
}
  
//トレンド判断の書き込み
  function addAttribute(sheet){
    //var sheet2 = exchange.getSheet().getSheetByName('data_1day');
    var last_row = sheet.getLastRow();
    sheet.getRange(last_row, 8).setValue(getEma(sheet));
    //sheet.getRange(last_row,8).setValue(this.big_trend());
    //sheet.getRange(last_row,9).setValue(this.small_trend(sheet));
    //sheet.getRange(last_row,10).setValue(this.over_high(sheet));
    //sheet.getRange(last_row,11).setValue(this.over_low(sheet));
  }
  
//古いデータを消去
  function delOld(sheet){
    if(sheet.getLashRow()>5000){
        sheet.deleteRow(2);
    }
  }


//単純移動平均線
  function getEma(sheet){
    var space = 20;
    var last_row = sheet.getLastRow();
    var space_row = sheet.getRange(last_row-space, 5, space, 1).getValues();
    var sum = 0;
    for (i=0;i<space;i++){
        sum+=space_row[i][0];
    }
    return sum/space;
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
  Logger.log(sheet.getRange(last_row,5,1,2).getValues()[0]);
  return sheet.getRange(last_row,5,1,2).getValues()[0];
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