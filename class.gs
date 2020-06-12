(function(global){
var BB = function(sheet){
        var x,sum = 0,ema = 0;
        var variance = 0;
        const space = 200;
        const v_rate = 3;
        var last_row = sheet.getLastRow();
        
        //200日分のデータが貯まるまで返値を0にする
        if(last_row>201){
            var space_row = sheet.getRange(last_row-(space-1), 5, space, 1).getValues();
        }else{
            var space_row = [];
            for(i=0;i<space;i++){
                space_row.push([0]);
            } 
        }
        //単純移動平均線を出力(200MA)
        for(i=0;i<space;i++){
            sum+=space_row[i][0];
        }
        var ema=sum/space;
        this.MA = ema;
        
        //MAの傾きを出力
        var past_MA = sheet.getRange(last_row,6).getValue();
        this.grad = ema-past_MA;
        
        //MAの傾きからトレンドorレンジの判断
        if(sheet.getName() == 'GBP_5m') x = 0.005;
        if(sheet.getName() == 'GBP_30m') x = 0.01;
        if(sheet.getName() == 'GBP_1h') x = 0.02;
        if(sheet.getName() == 'GBP_4h') x = 0.04;
        if(sheet.getName() == 'GBP_1d') x = 0.08;
        if(this.grad-x >= 0){
            this.trend = 'Up';
        }else if(this.grad+x <= 0){
            this.trend = 'Down';
        }else{
            this.trend = 'Range';
        }
        //標準偏差を出力
        //for(i=0;i<space;i++){
        //    variance+=Math.pow(this.MA-space_row[i][0],2);
        //}
        //variance = variance/(space-1);
        //this.std = Math.sqrt(variance); 

    //上のボリンジャーバンドを出力
        //this.Up = this.MA+v_rate*this.std;
    
    //下のボリンジャーバンドを出力
        //this.Down = this.MA-v_rate*this.std;
        
    //ボリンジャーバンドの幅を出力
        //this.length = this.Up-this.down;
   
    //ボリンジャーバンドの際を100%、EMAを0％とした時の現在の終値の割合を出力

        //if(last_row>21){
        //    this.percent=((space_row[space-1][0]-this.MA)/(v_rate*this.std))*100;
        //}else{
        //    this.percent=0;
        //}
    }
 global.BB = BB;
})(this);
