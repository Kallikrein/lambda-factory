"use strict";
const async = require('async');
const errors = require('lambda-errors');

function fail (error) {
	return function (event, context, callback) {
		callback(errors.internal(error));
	}
}

function invalidTasks (tasks, middlewares) {
	const _invalidTasks = Object.keys(middlewares).concat('config').filter(function (key) {
		return (typeof tasks[key] !== 'undefined');
	});
	if (_invalidTasks.length) {
		return {
			name: 'lambda-factory invalid task',
			message: 'reserved or middleware keyword : "' + _invalidTasks.join('", "') + '"'
		};
	}
	return null;
}

function invalidMiddlewares (middlewares) {
	const _invalidMiddlewares = Object.keys(middlewares).filter(function (key) {
		return (typeof middlewares[key] !== 'function');
	});
	if (_invalidMiddlewares.length) {
		return {
			name: 'lambda-factory invalid middleware',
			message: 'middleware not a function : "' + _invalidMiddlewares.join('", "') + '"'
		};
	}
	return null;
}

function Lambda (middlewares) {

	const _middlewares = Object.prototype.toString.call(middlewares) === "[object Object]"
		? middlewares : {};
	const _invalidMiddlewaresError = invalidMiddlewares(_middlewares);

	this.exec = function (tasks, config, callback) {

		if (_invalidMiddlewaresError) {
			return fail(_invalidMiddlewaresError);
		}

		const _tasks = Object.prototype.toString.call(tasks) === "[object Object]"
			? tasks : {};
		const _invalidTasksError = invalidTasks(_tasks, _middlewares);

		if (_invalidTasksError) {
			return fail(_invalidTasksError);
		}

	// CONFIG can be a function, then it is passed 'as is' as an auto parameter
		const _config = typeof config === "function" ? config : function (auto, _cb) {
	// else we pass a function that will inject the config value
			_cb(null, config);
		};

	// CALLBACK
		const _callback = typeof callback === "function" ? callback : function (err, result, _cb) {
		// if callback is null, pass the auto handler, else overwrite the handler with a constant
			_cb(err, callback || result);
		};

	// AUTO
		const _auto = {};
		// inject config after every middleware has calledback
		_auto.config = Object.keys(_middlewares).length ? 
			Object.keys(_middlewares).concat(_config) :
			_config.bind(null, {});
		// inject all tasks, add config as a root dependency
		Object.keys(_tasks).forEach(function (key) {
			_auto[key] = ['config'].concat(_tasks[key]);
		});

	// LAMBDA FUNCTION
		return function lambda (event, context, cb) {
			// inject middlewares
			Object.keys(_middlewares).forEach( function (key) {
				// bind event to middlewares
				_auto[key] = async.apply(_middlewares[key], event);
			});
			async.auto(_auto, function (err, result) {
				_callback(err, result, cb);
			});
		};

	}/* factory */

}/* Lambda */

module.exports = Lambda;