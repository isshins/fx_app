//1分足を記録し、そこからその他の時間足のシート作成
function main_data(){
    var sheets = getSheets();
    var now = new Date();
    if(stopScrape(now)==0){
        update(sheets.getSheetByName('data_1m'));
        delOld(sheets.getSheetByName('data_1m'),2000);
        dataDivide('GBP');
    }   
}

