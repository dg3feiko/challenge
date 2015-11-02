'use strict';
require('co-mocha');
require('chai').should();


var Consumer = require('../../../lib/consumer');
var fs = require("bluebird").promisifyAll(require("fs"));

describe("Consumer", function () {

	it("should extract rate with page with valid rate", function*() {
		let data = yield fs.readFileAsync(`${__dirname}/fixture/page_with_rate.fixture`);
		Consumer.prototype.parseExchangePage(data).should.be.ok;
	});

	it("should throw error with page without valid rate", function*() {
		let data = yield fs.readFileAsync(`${__dirname}/fixture/page_without_rate.fixture`);
		(function () {
			Consumer.prototype.parseExchangePage(data)
		}).should.Throw(Error);
	});

	it("should throw error with non xe.com page", function*() {
		let data = yield fs.readFileAsync(`${__dirname}/fixture/non_xe_page.fixture`);
		(function () {
			Consumer.prototype.parseExchangePage(data)
		}).should.Throw(Error);
	});


});