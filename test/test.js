var assert = require('assert');
var factory = require('../index');

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

	it('returns a function', function (done) {
		var lambda = factory({});
		lambda(event, null, done);
	});

	describe('first argument : auto', function () {

		it('fails if a reserved keyword is used (req)', function (done) {
			var lambda = factory({
				req: function (auto, cb) {
					cb(null, 'ok')
				}
			});
			lambda(event, null, fail(done));
		});

		it('fails if a reserved keyword is used (config)', function (done) {
			var lambda = factory({
				config: function (auto, cb) {
					cb(null, 'ok')
				}
			});
			lambda(event, null, fail(done));
		});

		it('should inject in auto', function (done) {
			var lambda = factory({
				test: function (auto, cb) {
					cb(null, 'value');
				}
			});
			lambda(event, null, function (err, auto) {
				assert.strictEqual(auto.test, 'value');
				done();
			})
		});

		it('should trigger callback error', function (done) {
			var lambda = factory({
				test: function (auto, cb) {
					cb(new Error('oups'));
				}
			});
			lambda(event, null, fail(done));
		});

	});

	describe('second argument : config', function () {

		it('should accept config as null', function (done) {
			var lambda = factory({});
			lambda(event, null, done);
		});

		it('should accept config as a value', function (done) {
			var lambda = factory({}, 'test');
			lambda(event, null, function (err, auto) {
				assert.strictEqual(auto.config, 'test');
				done();
			});
		});

		it('should accept config as a function', function (done) {
			var lambda = factory({}, function (auto, cb) {
				cb(null, 'cool');
			});
			lambda(event, null, function (err, auto) {
				assert.strictEqual(auto.config, 'cool');
				done();
			});
		});

	});

	describe('third argument : callback', function () {

		it('should accept callback as null', function (done) {
			var lambda = factory({});
			lambda(event, null, done);
		});

		it('should accept callback as a value', function (done) {
			var lambda = factory({}, null, 'value');
			lambda(event, null, function (err, result) {
				assert.strictEqual(result, 'value');
				done();
			});
		});

		it('should accept callback as a value', function (done) {
			var lambda = factory({}, null, function (err, auto, cb) {
				cb(null, 'success');
			});
			lambda(event, null, function (err, result) {
				assert.strictEqual(result, 'success');
				done();
			});
		});

	});

});