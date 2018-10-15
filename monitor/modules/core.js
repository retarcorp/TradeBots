const request = require('request');

module.exports = Core = {
    init() {
        console.log('Define new cycle');

        request({
            method: 'GET'
            ,uri: 'http://localhost:3003/api/tradeSignals/getData'
        }, (err, response, body) => {
            let data = [];
            body = JSON.parse(body);
            console.log(body, typeof body);

            if (err) {
                console.log(err);
                return;
            }



            if ((typeof body !== 'object' && !(body instanceof Array)) || body.length === 0) {
                setTimeout(this.init.bind(this), 10000);
                console.log('Request is empty');
                return;
            }

            this.update(body);
        });
    }

    ,getFromApi(timeframe) {
        return new Promise( (res, rej) => {
            (timeframe.indexOf('D') >= 0) ? (timeframe = "") : timeframe = "|"+timeframe;

            request({
                method: "POST"
                ,uri: 'https://scanner.tradingview.com/crypto/scan'
                ,json: {"filter":[{"left":"exchange","operation":"nempty"},{"left":"exchange","operation":"equal","right":"BINANCE"}],"symbols":{"query":{"types":[]},"tickers":[]},"columns":["name","close"+timeframe,"change"+timeframe,"change_abs"+timeframe,"high"+timeframe,"low"+timeframe,"volume"+timeframe,"Recommend.All"+timeframe,"exchange","description","name","subtype","pricescale","minmov","fractional","minmove2"],"sort":{"sortBy":"exchange","sortOrder":"asc"},"options":{"lang":"en"},"range":[0,1000]},
            }, (err, response, body) => {
                res(body.data);
            });
    	});
    }

    ,async update(data) {
        var tmfs = [];

    	data.map( elem => {
    		!(tmfs.find( tmf => tmf === elem.timeframe)) && tmfs.push(elem.timeframe);
    	});

    	for (let tmf of tmfs) {
    		response = await this.getFromApi(tmf.toLocaleUpperCase());

    		binance = response;

    		data = data.map( (elm) => {
     			const curr = binance.find( bin => bin.d[0] == elm.symbol && elm.timeframe == tmf);

     			if (!curr) {
     				return elm;
     			}

     			curr.d[7] < 0.5 && curr.d[7] > 0 && (elm.rating = "Buy");
     			curr.d[7] >= 0.5 && (elm.rating = "Active Buy");
     			curr.d[7] > -0.5 && curr.d[7] < 0 && (elm.rating = "Sell");
     			curr.d[7] <= -0.5 && (elm.rating = "Active Sell");
     			curr.d[7] == 0 && (elm.rating = "Neutral");
     			curr.d[7] === null && (elm.rating = "-");

     			return elm;
     		});

         }
        
     	this.sendData(data);
    }

    ,sendData(data) {
        request({
            method: "POST"
            ,uri: 'http://localhost:3003/api/tradeSignals/postData'
            ,json: data
        }, (err, response, body) => {
            if (err) {
                console.error(err);
                setTimeout(this.init.bind(this), 10000);
                return;
            }

            if (!body.length) {
                setTimeout(this.init.bind(this), 10000);
                return;
            }

            setTimeout(this.init.bind(this), 1000);
        });
        // let xhr = new XMLHttpRequest();
        // xhr.open('POST','http://localhost:3003/api/tradeSignals/postData',true);
        // xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        // xhr.onload = function(){
        //         setTimeout(start, 1000);
        // };
        // xhr.send(JSON.stringify(data))
    }
};