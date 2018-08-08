module.exports = class Martingale {
	constructor(value = 1.01, active = 0) {
		this.value = value;
		this.active = active;
	}
}