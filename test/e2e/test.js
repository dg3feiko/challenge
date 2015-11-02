'use strict';
var Producer = require("../../lib/producer");
var Consumer = require("../../lib/consumer");
var co = require("co");
var bluebird = require("bluebird");
var factory = require("../../factory/client_factory");
var debug = require("debug")("e2e");

co(function*() {
	try {

		let bs_client_producer = yield factory.createBsClient('localhost', 11300);
		let bs_client_consumer = yield factory.createBsClient('localhost', 11300);

		let mongo_collection = yield factory.createMongoCollection('mongodb://localhost:27017/aftership', "ExRates");

		let producer = new Producer(bs_client_producer);

		yield producer.putAJob("USD", "HKD");

		debug('A job is put to bs');

		let consumer = new Consumer(bs_client_consumer, mongo_collection, {
			ttl: 60,
			max_success: 10,
			max_failure: 3,
			delay_success: 60,
			delay_failed: 3
		});

		consumer.start();

		debug('Consumer started');

	} catch (e) {
		debug(`error occured ${e}`);
	}

});






