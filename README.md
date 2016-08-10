# lambda-factory
AWS lambda function generator

###Do I need this module ?

This module is intended to be used in a complex AWS serverless architecture.
If you don't know what AWS, serverless, or lambda function is, you don't need this module.

If you are an AWS user, this will help you standardize event parsing with middleware, share configs, apply consistent data reduction patterns before you send back data...

In my use case it added a lot of readability to complex interdependant async scenarii eg:
  - validate input data
  - get user in db 1
  - get token in db2
  - hash password
  - compare data from db 1 to user input
  - get data from keystore
  - get user in db2
  - merge data
  - create user
  - ...

With each function potentially failing, depending on other, returning data needed by several other functions, etc.

I now have short and clear dependency description.

###Installation

```npm install lambda-factory```

##usage

in your lambda function file

### instantiate a factory with middlewares
```javascript
var Lambda = require('lambda-factory');

/*
a middleware object can contain as many function as you want,
as long as you don't collidemiddleware names with your tasks names
*/
var middlewares = {
  // a middleware is a function that takes the AWS event as first argument and a callback (err, value) as second
  myMiddleware: function (event, cb) {
    //do w/e you need to do with the event data here
    cb(null, event.data);
  }
};

// middlewares are optional
var factory = new Lambda(middlewares);

// export your lambda to AWS 

exports.handler = factory.exec(tasks, config, callback);
```
### how to write your lambda logic :

####tasks

the tasks object follows the [async auto](http://caolan.github.io/async/docs.html#.auto) syntax
```javascript
var tasks = {
  valid: function (__, cb) {
    validate(__.myMiddleware.data, cb);
  },
  getDataFromDB: ['validate', function (__, cb) {
    myORM.get(__.validate, cb);
  }]
}
```
####config

the config parameter can be a function, in wich case it has the same prototype as tasks :

```javascript
function config (__, cb) {
  //do some async stuff here
  if (/*...*/)
    cb('an error happened and config failed');
  else
    cb(null, 'some data');
};

```

It can also be a value, in wich case the value will be injected in the auto object under the 'config' property

```javascript
var config = {
  myAPIKey: 'secret',
  someImportantConfigParam: 'whatever'
};
```

Config is executed / injected, once all middlewares have called back, and before all tasks are started.


####callback

the callback parameter can be a function, in wich case it hase the following prototype :

```javascript
function callback (err, results, cb) {
  if (err)
    cb(err);
  else {
    cb(results.whatever);
  }
}
```
NB : cb is the callback the lambda function is invoked with. This last call will terminate the lambda, and potentially send data to your user.
Be carefull to avoid sending the auto object, as it can contain confidential data.

callback can also be a constant value, in wich case it will be passed as the success value.

```javascript
var callback = "success"; // the lambda function will return "success"
```
