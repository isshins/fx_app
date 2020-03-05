(function(global){

var BB = function(sheet){
        var sum = 0;
        var ema = 0;
        var variance = 0;
        const space = 20;
        const v_rate = 3;
        var last_row = sheet.getLastRow();
        
        //20日分のデータが貯まるまで返値を0にする
        if(last_row>21){
            var space_row = sheet.getRange(last_row-(space-1), 5, space, 1).getValues();
        }else{
            var space_row = [];
            for(i=0;i<space;i++){
                space_row.push([0]);
            } 
        }
        //単純移動平均線を出力
        for(i=0;i<space;i++){
            sum+=space_row[i][0];
        }
        var ema=sum/space;
        this.MA = ema;

        //標準偏差を出力
        for(i=0;i<space;i++){
            variance+=Math.pow(this.MA-space_row[i][0],2);
        }
        variance = variance/(space-1);
        this.std = Math.sqrt(variance); 

    //上のボリンジャーバンドを出力
        this.Up = this.MA+v_rate+this.std;
    
    //下のボリンジャーバンドを出力
        this.Down = this.MA-v_rate*this.std;
   
    //ボリンジャーバンドの際を100%、EMAを0％とした時の現在の終値の割合を出力

        if(last_row>21){
            this.percent=((space_row[space-1][0]-this.MA)/(v_rate*this.std))*100;
        }else{
            this.percent=0;
        }
    }
 global.BB = BB;
})(this);
