module.exports = {

	init: async function() {

		this.Client = require('mongodb').MongoClient;
		this.ObjectId = require('mongodb').ObjectID;
		this.Assert = require('assert');

		this.URL = 'mongodb://localhost:27017/TradeBots';
		this.DB = 'TradeBots';

		await this.syncTrace();

		console.log('Successfully init');

		return this;
	}

	,trace: function() {
		this.Client.connect(this.URL, (error, client) => {
			this.Assert.equal(null, error);
			console.log('Successfully conected to MongoDB');

			this.cli = client;
			this.db = this.cli.db(this.DB);
			db = client.db(this.DB);

            //client.close();
		});
	}

	, syncTrace: function() {
		return new Promise( (resolve, reject) => {

			this.Client.connect(this.URL, (error, client) => {
				this.Assert.equal(null, error);
				console.log('Successfully conected to MongoDB');
	
				this.cli = client;
				this.db = this.cli.db(this.DB);
				db = client.db(this.DB);
				if (error) reject(error)
				resolve({status: 'ok'})
			});
		})
	}

	,connect: function(callback) {
		this.Client.connect(this.URL, (error, client) => {
			this.Assert.equal(null, error);
			db = client.db(this.DB);

			callback(db, client);

			// client.close();
		});
	}

	,insert: function(data, collection, callback) {
		// this.connect( (db, client) => {
			let coll = this.db.collection(collection);

			//console.log(data, collection, coll);

			if (!data.length) data = [data];

			coll.insertMany(data, (err, data) => {
				this.Assert.equal(err, null);

				if (callback) callback({ status: 'ok' });

				console.log('Data inserted');

                //client.close();
			});
		// });
	}

	,syncInsert: function(data, collection) {
		let coll = this.db.collection(collection);

		if (!data.length) data = [data];

		return new Promise( (resolve, reject) => {
			coll.insertMany(data, (err, data) => {
				this.Assert.equal(err, null)
				if(err) reject(err)
				resolve(data)
			})
		})
	}

	,syncSelect: function(key, collection) {
		let coll = this.db.collection(collection)
		return new Promise((resolve, reject) => {
			coll.find(key).toArray( (err, data) => {
				this.Assert.equal(err, null)
				if(err) reject(err)
				resolve(data)
			})
		})
	}

	,select: function(key, collection, callback) {
		let coll = this.db.collection(collection)

		if (!(typeof key == 'object')) key = {};
		coll.find(key).toArray( (err, data) => {
			this.Assert.equal(err, null)
			if (callback) callback(data)
		})
	}

	,syncSelect: function(key, collection) {
		let coll = this.db.collection(collection)
		return new Promise( (resolve, reject) => {
			if (!(typeof key == 'object')) key = {};
			coll.find(key).toArray( (err, data) => {
				this.Assert.equal(err, null)
				if(err) reject(err)
				resolve(data)
			})
		})
	}

	,syncUpdate: function(key, change, collection) {
		// this.connect( (db, client) => {
		let coll = this.db.collection(collection)

		if (!(typeof key == 'object')) key = {}
		if (!(typeof change == 'object')) change = {}
		return new Promise( (resolve, reject) => {
			coll.update(key, { $set: change }, { upsert: true }, (err, data) => {
				this.Assert.equal(err, null)
				if (err) reject(err)
				resolve(data)
			})
		})
	}

	,updateMany: function(key, change, collection, callback) {
		let coll = this.db.collection(collection);
		let length = change.length - 1

		if (!(typeof key == 'object')) key = {};
		change.forEach((elem, i) => {
			delete elem._id
			this.update({ id: elem.id }, elem, collection, (err, data) => {
				if(i == length && callback) callback(data) 
			})
		})
	}

	,update: function(key, change, collection, callback) {
		// this.connect( (db, client) => {
			let coll = this.db.collection(collection);

			if (!(typeof key == 'object')) key = {};
			if (!(typeof change == 'object')) change = {};

			coll.update(key, { $set: change }, { upsert: true }, (err, data) => {
				this.Assert.equal(err, null);

				if (callback) callback(data, err);
				// console.log('Data updated');

                //client.close();
			});
		// });
	}

	,count: function(key, collection, callback) {
		// this.connect( (db, client) => {
			let coll = this.db.collection(collection);

			if (typeof key !== 'object') key = {};

			coll.countDocuments(key)
				.then( (count) => {
					(callback) ? callback(count) : 0

                    //client.close();
                })
				.catch(err => console.log(err));
		// })
	}

	,delete: function(key, collection, callback) {
		// this.connect( (db, client) => {
			let coll = this.db.collection(collection);

			if (!(typeof key == 'object')) key = { nothingToDelete: Infinity };

			coll.removeMany(key, (err, data) => {
				this.Assert.equal(err, null);

				if (callback) callback(data);

				console.log('Data deleted');

                //client.close();
			});
		// });
	}

	,syncDelete: function(key, collection) {
		let coll = this.db.collection(collection);
		if (!(typeof key == 'object')) key = { nothingToDelete: Infinity };

		return new Promise( (resolve, reject) => {
			coll.removeMany(key, (err, data) => {
				this.Assert.equal(err, null);
				if(err) reject(err)
				resolve(data)
			});
		})
	}

	,drop: function(collection, callback) {
		// this.connect( (db) => {
			let coll = this.db.collection(collection);

			if (!collection.length) return;

			coll.drop( (err, data) => {
				if (err) throw err;

				if (callback) callback(data);

				console.log('Collection deleted');
			});
		// });
	}

	,toObjectId: function(str) {
		console.log(this.ObjectId(str));
		return new this.ObjectId(str);
	}
}
