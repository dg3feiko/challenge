var bluebird = require('bluebird');
var co = require("co");
var fivebeans = require('fivebeans');
var debug = require("debug")("factory");

bluebird.promisifyAll(require("mongodb"));
var MongoClient = require('mongodb').MongoClient;


module.exports = {
	createBsClient: function (host, port) {
		var bs_client = new fivebeans.client(host, port);
		bs_client = bluebird.promisifyAll(bs_client);
		return new Promise(function (resolve, reject) {
			bs_client
				.on('connect', function () {
					resolve(bs_client);
					debug(`bs client created: ${host} ${port}`)
				})
				.on('error', function (err) {
					reject(err);
					debug(`bs failed ${err}`)
				})
				.on('close', function () {
					reject("bs client closed");
					debug(`bs closed`)
				})
				.connect();
		});
	},
	createMongoCollection: function (mongo_url, collection) {
		return co(function*(){
			var db = yield MongoClient.connectAsync(mongo_url);
			var coll = db.collection(collection);
			debug(`mongo connection created: ${mongo_url} ${collection}`);
			return coll;
		});
	}
};
