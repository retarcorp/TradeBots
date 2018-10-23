const Mongo = require('./Mongo');
const M = require('./Message');
const { pages } = ('../config/config.js');

class Pages {
	async createPage(admin = {}, pageData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin) && await this.pageExists(pageData)) {
			Mongo.syncInsert(pageData, pages.collection)
				.then(result => {
					callback(M.getSuccessfullyMessage({ data: result }));
				});
		} else callback(M.getFailureMessage({ message: 'Недостаточно прав!' }));
	}

	async pageExists(page = {}) {
		page = { slug: page.slug };
		let pagesData = await Mongo.syncSelect(page, CONSTANTS.TARIFFS_COLLECTION);
		return tariffsArray.length;
	}

	async authenticationAdmin(admin = {}) {
		if(admin.name && admin.admin) {
			admin = { name: admin.name };
			let adminData = await Mongo.syncSelect(admin, CONSTANTS.USERS_COLLECTION);
			return adminData.length;

		} else {
			return false;
		}
	}
}

module.exports = new Pages();