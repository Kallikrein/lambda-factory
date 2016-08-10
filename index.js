"use strict";
const errors = require('lambda-errors');
const req = require('lambda-request');
const async = require('async');

function reserved (auto) {
	const reservedKeyword = [
		"config",
		"req"
	];
	return reservedKeyword.filter(function (keyword) {
		return (typeof auto[keyword] !== "undefined");
	});
}

function lambdaFactory (auto, config, callback) {

	// if a reserved keyword is used in the auto object, return a gracefully failing callback
	const usedReservedKeywords = reserved(auto);
	if (usedReservedKeywords.length) {
		return function fail (event, context, cb) {
			cb(errors.internal({
				name: 'invalid factory argument',
				message: 'reserved keyword used : ' + usedReservedKeywords.join(' ,')
			}));
		};
	}

	const _auto = {};
	Object.keys(auto).forEach(function (key) {
		// config is an opinionated common dependency for all functions. It is optional, though.
		_auto[key] = ['config'].concat(auto[key]);
	});

	// if config is a function, pass it as an auto parameter
	const _config = typeof config === "function" ? config : function (auto, _cb) {
		// else we pass a wrapper that will inject the config value
		_cb(null, config);
	};

	_auto.config = ['req', _config];

	const _callback = typeof callback === "function" ? callback : function (err, result, _cb) {
		// if callback is null, pass the auto handler, else overwrite the handler with a constant
		_cb(err, callback || result);
	};

	return function lambda (event, context, cb) {
		_auto.req = async.apply(req, event);
		async.auto(_auto, function (err, result) {
			_callback(err, result, cb);
		});
	};

}

module.exports = lambdaFactory;