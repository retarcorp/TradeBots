const Mongo = require('./Mongo');
const M = require('./Message');
const { pages } = require('../config/config');
const CONSTANTS = require('../constants');
const uniqid = require('uniqid');

class Pages {
	async createPage(admin = {}, pageData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			if(!(await this.pageExists(pageData))) {
				pageData.pageId = uniqid.time(pages.id);
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
			let pagesList = await Mongo.syncSelect({}, pages.collection);
			callback(M.getSuccessfullyMessage({ data: pagesList }));
		} else callback(M.getFailureMessage({ message: 'Недостаточно прав!' }));
	}

	async removePage(admin = {}, pageSlug = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			if (await this.pageExists(pageSlug)) { 

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

	async updatePage(admin = {}, nextPageData = {}, callback = (data = {}) => {}) {
		if(await this.authenticationAdmin(admin)) {
			if (!(await this.pageExists(nextPageData))) { 
				let key = { pageId: nextPageData.pageId },
					change = Object.assign({}, nextPageData);
				
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
			try {
				admin = { name: admin.name };
				console.log("constants   ---" + CONSTANTS.USERS_COLLECTION);
				let adminData = await Mongo.syncSelect(admin, CONSTANTS.USERS_COLLECTION);
				return adminData.length;
			} catch (e) {
				console.error(e)
			}

		} else {
			return false;
		}
	}
}

module.exports = new Pages();