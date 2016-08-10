var assert = require('assert');
var Lambda = require('../index');

function fail (done) {
	return function (err, value) {
		if (err)
			done(null, err);
		else
			done(new Error(value));
	};
}

const event = {
	body: "hello"
}

describe('Factory', function () {

	it('returns a factory', function (done) {
		var factory = new Lambda();
		var lambda = factory.exec({});
		lambda(event, null, done);
	});

	describe('first argument : auto', function () {

		it('fails if a reserved keyword is used (req)', function (done) {
			new Lambda({
				req: function (event, cb) {
					cb(null, 'first');
				}
			}).exec({
				req: function (auto, cb) {
					cb(null, 'second')
				}
			})(event, null, fail(done));
		});

		it('fails if a reserved keyword is used (config)', function (done) {
			new Lambda().exec({
				config: function (auto, cb) {
					cb(null, 'ok')
				}
			})(event, null, fail(done));
		});

		it('should inject in auto', function (done) {
			new Lambda().exec({
				test: function (auto, cb) {
					cb(null, 'value');
				}
			})(event, null, function (err, auto) {
				assert.strictEqual(auto.test, 'value');
				done();
			})
		});

		it('should trigger callback error', function (done) {
			new Lambda().exec({
				test: function (auto, cb) {
					cb(new Error('oups'));
				}
			})(event, null, fail(done));
		});

	});

	describe('second argument : config', function () {

		it('should accept config as null', function (done) {
			new Lambda().exec()(event, null, done);
		});

		it('should accept config as a value', function (done) {
			new Lambda().exec({}, 'test')(event, null, function (err, auto) {
				assert.strictEqual(auto.config, 'test');
				done();
			});
		});

		it('should accept config as a function', function (done) {
			new Lambda().exec({}, function (auto, cb) {
				cb(null, 'cool');
			})(event, null, function (err, auto) {
				assert.strictEqual(auto.config, 'cool');
				done();
			});
		});

	});

	describe('third argument : callback', function () {

		it('should accept callback as null', function (done) {
			new Lambda().exec()(event, null, done);
		});

		it('should accept callback as a value', function (done) {
			new Lambda().exec(null, null, 'value')(event, null, function (err, result) {
				assert.strictEqual(result, 'value');
				done();
			});
		});

		it('should accept callback as a value', function (done) {
			new Lambda().exec(null, null, function (err, auto, cb) {
				cb(null, 'success');
			})(event, null, function (err, result) {
				assert.strictEqual(result, 'success');
				done();
			});
		});

	});

});