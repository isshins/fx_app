//五分足のmain関数
function main_5M() {
  var now = new Date();
  var sheet = exchange.getSheet().getActiveSheet();
  //稼働時間中で5分毎にデータを書き込む（タイムトリガー)
  if(stopScrape(now)==0){
    var ex_json = exchange.callExchangeAPI();
    exchange.writeSheets(ex_json,sheet);//スクレイピングした値を書き込む
    addAttribute(sheet);//特徴量を追加
    delOld(sheet);//データの上限を制限
    //極値の検出
   // if(now.getMinutes()==0 && now.getHours()!=7){
     // updateExtreme();
   // }
  } 
}

function main_data(){
var sheets = getSheets();
var now = new Date();
  if(stopScrape(now)==0){
     update(sheets.getSheetByName('data_1m'));
     dataDivide('GBP');
     }   
   }
   
