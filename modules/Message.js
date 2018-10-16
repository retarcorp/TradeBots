class Message {
	constructor() {
		this.FailureMessage = {
			status: 'error',
			message: 'Произошла ошибка!'
		}

		this.SuccessfullyMessage = {
			status: 'ok',
			message: 'Выполнено успешно!'
		}
	}

	getSuccessfullyMessage(data = {}) {
		return Object.assign({}, this.SuccessfullyMessage, data);
	}

	getFailureMessage(data = {}) {
		return Object.assign({}, this.FailureMessage, data);
	}
}

module.exports = new Message();