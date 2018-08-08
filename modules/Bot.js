let BotSettings = require('./BotSettings');
/*
var Bot = {
	Title: 'name',
	State: 0,
	Status: 0,
	Pair: {},
	Orders: [{},{},{}],
	CurrentOrder: {},
	Settings: {}
}
*/
module.exports = class Bot {
	constructor({Title, Pair}){
		this.Title = Title;
		this.Pair = Pair;
		this.BotSettings = new BotSettings();
		console.log(this);
	}
}