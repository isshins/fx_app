//1分足を記録し、そこからその他の時間足のシート作成
function main_data(){
    var sheets = getSheets();
    var now = new Date();
    var data = sheets.getSheetByName('data_1m');
    if(stopScrape(now)==0){
        update(data);
        delOld(data,2000);
        dataDivide('GBP');
        noticeBB('GBP');
        noticeSharp('GBP');
    }   
}

