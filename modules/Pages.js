const Mongo = require('./Mongo');
const M = require('./Message');
const { pages } = require('../config/config');
const CONSTANTS = require('../constants');

class Pages {
	async createPage(admin = {}, pageData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			if(!(await this.pageExists(pageData))) {
				Mongo.syncInsert(pageData, pages.collection)
					.then(result => {
						callback(M.getSuccessfullyMessage({ data: result }));
					})
					.catch(err => {
						console.log(err);
						callback(M.getFailureMessage({ message: 'ошибка на сервере!', error: err }));
					});

			} else callback(M.getFailureMessage({ message: 'Такая страница уже существует!' }));
		} else callback(M.getFailureMessage({ message: 'Недостаточно прав!' }));
	}

	async getPages(admin = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			let pages = await Mongo.syncSelect({}, pages.collection);
			callback(M.getSuccessfullyMessage({ data: pages }));
		} else callback(M.getFailureMessage({ message: 'Недостаточно прав!' }));
	}

	async removePage(admin = {}, pageSlug = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			if(await this.pageExists(pageData)) { 

				Mongo.syncDelete({ slug: pageSlug.slug }, pages.collection)
					.then(result => {
						callback(M.getSuccessfullyMessage({ data: result }));
					})
					.catch(err => {
						console.log(err);
						callback(M.getFailureMessage({ message: 'ошибка на сервере!', error: err }));
					});

			} else callback(M.getFailureMessage({ message: 'Такая страница не существует!' }));
		} else callback(M.getFailureMessage({ message: 'Недостаточно прав!' }));
	}

	async updatePage(admin = {}, nexPageData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			if(await this.pageExists(pageData)) { 
				let key = { slug: nexPageData.slug },
					change = Object.assign({}, nexPageData);

				change.slug = change.nextSlug;
				delete change.nextSlug;
				
				Mongo.syncUpdate(key, change, pages.collection)
					.then(result => {
						callback(M.getSuccessfullyMessage({ page: change, result: result }));
					})
					.catch(err => {
						console.log(err);
						callback(M.getFailureMessage({ message: 'ошибка на сервере!', error: err }));
					});

			} else callback(M.getFailureMessage({ message: 'Такая страница не существует!' }));
		} else callback(M.getFailureMessage({ message: 'Недостаточно прав!' }));
	}

	async pageExists(page = {}) {
		page = { slug: page.slug };
		let pagesData = await Mongo.syncSelect(page, pages.collection);
		return pagesData.length;
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