'use strict';
class Producer {
	constructor(bs_client) {
		this.bs_client = bs_client;
	}

	putAJob(from, to) {
		return this.bs_client.putAsync(
			0,
			0,
			60,
			JSON.stringify({"from": from, "to": to}));
	}
}

module.exports = Producer;