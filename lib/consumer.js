'use strict';
var co = require("co");
var debug = require("debug")("consumer");
class Consumer {
	constructor(bs_client, mongo_collection, config) {
		this.bs_client = bs_client;
		this.mongo_collection = mongo_collection;
		this.config = config;
		this.should_stop = false;
	}

	start() {
		let self = this;
		return co(function* () {
			while (!self.should_stop) {
				yield self.consumeJob();
			}
		})
	}

	stop(){
		this.should_stop = true;
	}


	consumeJob() {
		let self = this;
		return co(function*() {
			let res = yield self.bs_client.reserveAsync();
			let job = JSON.parse(res[1]);
			job.id = res[0];

			let success_count = job.success_count || 0;
			let fail_count = job.fail_count || 0;

			try {
				//get rate from xe
				let rate = yield self.getExchangeRate(job.from, job.to);
				// save to db
				yield self.mongo_collection.insertOneAsync({
					from: job.from,
					to: job.to,
					rate: rate,
					created_at: new Date()
				});

				//determine flow
				success_count++;
				if (success_count >= self.config.max_success) {
					yield self.bs_client.destroyAsync(job.id);
					debug("terminated a job with successful result");
					return;
				} else {
					yield self.bs_client.destroyAsync(job.id);
					debug("re-put a job with successful result");
					return self.bs_client.putAsync(
						0,
						self.config.delay_success,
						self.config.ttl,
						JSON.stringify({
							"from": job.from,
							"to": job.to,
							"success_count": success_count,
							"fail_count": fail_count
						})
					);

				}
			} catch (error) {
				fail_count++;
				if (fail_count >= self.config.max_failure) {
					yield self.bs_client.buryAsync(job.id);
					debug("terminated a job with failure");
					return;
				} else {
					yield self.bs_client.destroyAsync(job.id);
					debug("re-put a job with failure");
					return self.bs_client.putAsync(
						0,
						self.config.delay_failed,
						self.config.ttl,
						JSON.stringify({
							"from": job.from,
							"to": job.to,
							"success_count": success_count,
							"fail_count": fail_count
						})
					);
				}
			}
		});
	}


	getExchangeRate(from, to) {
		var self = this;
		return co(function* () {
			let request = require("co-request");
			let result = yield request(`http://www.xe.com/currencyconverter/convert/?Amount=1&From=${from}&To=${to}`);
			let body = result.body;
			return self.parseExchangePage(body);
		});
	}

	parseExchangePage(body) {
		var cheerio = require("cheerio");
		var $ = cheerio.load(body);
		var rate = $(".uccRes td.rightCol").text().split(/\s/)[0];
		rate = parseFloat(rate);
		if(!rate){
			throw new Error("no result");
		}
		return rate;
	}
}


module.exports = Consumer;



