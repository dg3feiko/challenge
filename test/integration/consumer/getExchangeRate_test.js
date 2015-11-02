'use strict';
require('co-mocha');
require('chai').use(require("chai-as-promised"));
require('chai').should();

var Consumer = require('../../../lib/consumer');

describe("Consumer", function () {
	it("should get correct exchange rate from USD to HKD", function*() {
		let res = yield Consumer.prototype.getExchangeRate("USD", "HKD");
		res.should.be.within(7, 8);
	});

	it("should get correct exchange rate from CNY to CAD", function*() {
		let res = yield Consumer.prototype.getExchangeRate("CNY", "CAD");
		res.should.be.ok;
	});

	it("should throw error with invalid currency", function *() {
		return Consumer.prototype.getExchangeRate("ABC", "EFG").should.be.rejectedWith(Error)
	});
});