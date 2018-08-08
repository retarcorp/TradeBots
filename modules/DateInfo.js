module.exports = class DateInfo {
	constructor(
		created = Date.now(),
		closed = null
	) {
		this.created = created;
		this.closed = closed;
	}
}