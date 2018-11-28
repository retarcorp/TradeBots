const Mongo = require('../modules/Mongo');
const Balance = require('../modules/Balance');
const CONSTANTS = require('../constants');

Mongo.init().then(() => {
	console.log('start address redefinition...');
	const _users_ = CONSTANTS.USERS_COLLECTION;
	Mongo.select({}, _users_, (users => {
		if(users.length) {

			users.forEach(async user => {
				let userId = user.userId,
				walletAddress = await Balance.createWallet({userId: userId});

				Mongo.update({ userId }, { walletAddress }, _users_, () => {
					console.log(userId, user.name, 'ok');
				});
			});
			return null;
		} else {
			console.log('any problems with getting users info');
			console.log(users);
			return null;
		}
	}));
});
