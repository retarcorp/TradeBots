const Mongo = require('../modules/Mongo');
Mongo.init().then(d => {
	Mongo.select({}, 'users', users => {
		let amountComplited = 0;
		for( let jj = 0; jj < users.length; jj++) {
			let user = users[jj];
			if(user.bots.length) {
				for (let i = 0; i < user.bots.length; i++) {
					console.log();
					console.log(user.name, user.bots[i].title,  user.bots[i].botID, Object.keys(user.bots[i].processes).length);
					user.bots[i].processes = {};
					user.bots[i].status = false;
					console.log(user.name, user.bots[i].title, user.bots[i].botID, Object.keys(user.bots[i].processes).length);
				}
				amountComplited++;
				Mongo.update({name: user.name}, {bots: user.bots}, 'users', (res) => {console.log(user.name, 'ok', 'amountComplited - ' + amountComplited)});
			}
		}
	});
});