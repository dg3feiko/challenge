'use strict';
require('co-mocha');
var Consumer = require('../../../lib/consumer');
var sinon = require("sinon");
require('sinon-as-promised');
require('chai').should();

describe("Consumer", function () {

	it("should retry after success result with `delay_success` delay and increased success count, write record to db", function*() {
		let mock_bs_client = {
			reserveAsync: sinon.stub().returns([123, JSON.stringify({
				from: "HKD",
				to: "CNY",
				success_count: 9,
				fail_count: 5
			})]),
			insertOneAsync: sinon.stub().resolves(),
			destroyAsync: sinon.stub().resolves(),
			buryAsync: sinon.stub().resolves(),
			putAsync: sinon.spy()
		};

		let mock_mongo_collection = {
			insertOneAsync: sinon.stub().resolves()
		};

		//simulate successfully getting rates
		let mock_getExchangeRate = sinon.stub().returns(Promise.resolve(12.123));

		let consumer = new Consumer(mock_bs_client, mock_mongo_collection, {
			ttl: 60,
			max_success: 99,
			max_failure: 23,
			delay_success: 392,
			delay_failed: 412
		});

		consumer.getExchangeRate = mock_getExchangeRate;

		yield consumer.consumeJob();

		//verify delay
		mock_bs_client.putAsync.args[0][1].should.equal(392);
		let payload = JSON.parse(mock_bs_client.putAsync.args[0][3]);
		//verify success count
		payload.success_count.should.equal(10);
		//verify db insertion
		let db_record = mock_mongo_collection.insertOneAsync.args[0][0];
		db_record.from.should.equal("HKD");
		db_record.to.should.equal("CNY");
		db_record.rate.should.equal(12.123);
		db_record.created_at.should.ok;

	});

	it("should retry after failed with `delay_failed` delay and increased failed count", function*() {

		let mock_bs_client = {
			reserveAsync: sinon.stub().returns([123, JSON.stringify({
				from: "HKD",
				to: "CNY",
				success_count: 9,
				fail_count: 5
			})]),
			insertOneAsync: sinon.stub().resolves(),
			destroyAsync: sinon.stub().resolves(),
			buryAsync: sinon.stub().resolves(),
			putAsync: sinon.spy()
		};

		let mock_mongo_collection = {
			insertOneAsync: sinon.stub().resolves()
		};

		//simulate errors on getting rate
		let mock_getExchangeRate = sinon.stub().returns(Promise.reject(new Error()));

		let consumer = new Consumer(mock_bs_client, mock_mongo_collection, {
			ttl: 60,
			max_success: 99,
			max_failure: 23,
			delay_success: 392,
			delay_failed: 412
		});

		consumer.getExchangeRate = mock_getExchangeRate;

		yield consumer.consumeJob();

		//verify delay
		mock_bs_client.putAsync.args[0][1].should.equal(412);
		let payload = JSON.parse(mock_bs_client.putAsync.args[0][3]);
		//verify success count
		payload.fail_count.should.equal(6);
	});


	it("should stop retrying and destroy the job when `max_success` reaches", function*() {
		let mock_bs_client = {
			reserveAsync: sinon.stub().returns([123, JSON.stringify({
				from: "HKD",
				to: "CNY",
				success_count: 9,
				fail_count: 5
			})]),
			insertOneAsync: sinon.stub().resolves(),
			destroyAsync: sinon.stub().resolves(),
			buryAsync: sinon.stub().resolves(),
			putAsync: sinon.spy()
		};

		let mock_mongo_collection = {
			insertOneAsync: sinon.stub().resolves()
		};

		//simulate successfully getting rates
		let mock_getExchangeRate = sinon.stub().returns(Promise.resolve(12.123));

		let consumer = new Consumer(mock_bs_client, mock_mongo_collection, {
			ttl: 60,
			max_success: 10,
			max_failure: 99,
			delay_success: 392,
			delay_failed: 412
		});

		consumer.getExchangeRate = mock_getExchangeRate;

		yield consumer.consumeJob();

		//verify
		mock_bs_client.putAsync.called.should.be.false;
		mock_bs_client.destroyAsync.called.should.be.true;

	});

	it("should stop retrying and bury the job when `max_failure` reaches", function*() {
		let mock_bs_client = {
			reserveAsync: sinon.stub().returns([123, JSON.stringify({
				from: "HKD",
				to: "CNY",
				success_count: 9,
				fail_count: 99
			})]),
			insertOneAsync: sinon.stub().resolves(),
			destroyAsync: sinon.stub().resolves(),
			buryAsync: sinon.stub().resolves(),
			putAsync: sinon.spy()
		};

			let mock_mongo_collection = {
				insertOneAsync: sinon.stub().resolves()
			};

			//simulate errors on getting rate
			let mock_getExchangeRate = sinon.stub().returns(Promise.reject(new Error()));

		let consumer = new Consumer(mock_bs_client, mock_mongo_collection, {
			ttl: 60,
			max_success: 10,
			max_failure: 100,
			delay_success: 392,
			delay_failed: 412
		});

		consumer.getExchangeRate = mock_getExchangeRate;

		yield consumer.consumeJob();

		//verify
		mock_bs_client.putAsync.called.should.be.false;
		mock_bs_client.buryAsync.called.should.be.true;

	});




});