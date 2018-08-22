let addbtn = document.getElementsByClassName('bots__button-add')[0];
let addBotBtn = document.getElementsByClassName('button__add-bot')[0];
let addNewCondBtn = document.getElementsByClassName('button__add-new-conditions')[0];

let auto = document.querySelector('[id="radio-auto"]');
let hand = document.querySelector('[id="radio-hand"]');

const termsOfATransaction = document.querySelector('[id="terms__recommendation"]');
const timeframe = document.querySelector('[id="terms__timeframe"]');

let TRWSignals = [];
if(addbtn)
	addbtn.addEventListener('click', (e) => {
		e.preventDefault();
		console.log('+ bot');
		// let xhr = new XMLHttpRequest();
		// xhr.open('POST', '/bots-add', true);
		// xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		// let body = 'Title=' + Date.now() + '&Pair=BTCETH';
		// xhr.send(body);
	});

if(addNewCondBtn)
	addNewCondBtn.addEventListener('click', e => {
		e.preventDefault();
		if(termsOfATransaction && timeframe){
			TRWSignals.push({
				termsOfATransaction: termsOfATransaction.value,
				timeframe: timeframe.value
			});
		}
		console.log(TRWSignals)
	})

if(addBotBtn)
	addBotBtn.addEventListener('click', e => {
		e.preventDefault();
		let form = {};
		if(auto.checked){
			console.log('тупо автобот')
			form = {
				title: document.querySelector('[id="bot__name-auto"]').value,
				state: 0,
				pair: { 
					from: "BTC",
					to: document.querySelector('[id="base__pai-autor"]').value
				},
				traidingSignals: TRWSignals,
				dailyVolumeBTC: document.querySelector('[id="day__amount-auto"]').value
			}
			console.log(form);
		}
		else if(hand.checked){
			console.log('тупо ручнобот')
			form = {
				title: document.querySelector('[id="bot__name"]').value,
				state: 1,
				pair: {
					from: document.querySelector('[id="main__pair"]').value,
					to: document.querySelector('[id="quotable__pair"]').value
				},
				initialOrder: document.querySelector('[id="start__order"]').value,
				safeOrder: {
					size: document.querySelector('[id="save__order"]').value,
					amount: document.querySelector('[id="count__save-order"]').value
				},
				maxOpenSafetyOrders: document.querySelector('[id="count__max-save-order"]').value,
				stopLoss: document.querySelector('[id="stop__loss"]').value,
				takeProfit: document.querySelector('[id="take__profit"]').value,
				deviation: document.querySelector('[id="deviation"]').value,
				martingale: {
					value: document.querySelector('[id="save__order-up"]').value,
					active: document.querySelector('[id="martingale-on"]').checked
				}
			}
		}	

		// console.log(form)
		let xhr = new XMLHttpRequest();
		xhr.open('POST', '/bots-add', true);
		// xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.setRequestHeader('Content-Type', 'application/json');
		// xhr.send(JSON.stringify(form));
		xhr.send(JSON.stringify(form));
	});