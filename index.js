/**
 * Created by tolgahan on 03.11.2016.
 */
"use strict";
const proxies = new Map();
const ITER = Symbol('ITER');
const VAL = Symbol('VAL');
const iterator = Symbol('iterator');
const callback = Symbol('callback');

function awaiter(obj, target, noCache) {
    if(typeof obj === 'function'){

        if(isGeneratorFunc(obj)){
            return obj;
        }

        return function *() {
            var args = Array.prototype.slice.call(arguments);
            yield new Promise((resolve, reject) => {
                args.push(function () {
                    var response = Array.prototype.slice.call(arguments);
                    if(response[0] instanceof Error){
                        response[0].args = response;
                        reject(response[0]);
                    } else {
                        switch (response.length){
                            case 0:
                                return resolve();
                            case 1:
                                return resolve(response[0]);
                            case 2:
                                if(response[0] === null || response[0] === void 0){
                                    return resolve(response[1]);
                                }
                                return resolve(response);
                            default:
                                return resolve(response);
                        }
                    }
                });
                obj.apply(target, args);
            });
        };
    }

    if(proxies.has(obj)){
        return proxies.get(obj);
    }

    if(!obj || typeof obj !== 'object' || Array.isArray(obj) || typeof obj[Symbol.iterator] === 'function'){
        return obj;
    }

    var proxy = new Proxy(obj, {
        has: function (target, prop) {
            return (prop in target);
        },
        ownKeys: function (target) {
            return Object.getOwnPropertyNames(target);
        },
        get: function (target, prop) {
            var v = target[prop];
            if(typeof v === 'function'){
                return awaiter(v, target, noCache);
            }
            return awaiter(v, target, true);
        }
    });

    if(!noCache){
        proxies.set(obj, proxy);
    }
    return proxy;
}

const GF = function *() {};

function isGeneratorFunc(a) {
    return typeof a === 'function' &&  GF.constructor === a.constructor;
}

function isGeneratorObj(a) {
    return a && GF.prototype.constructor === a.constructor
}

function run(genFunc, complete) {

    var rootObj = genFunc();
    function exit(result) {
        complete(result, rootObj);
    }

    return (function doRun(genObj, cb) {
        function next(prev) {
            if(prev instanceof Error){
                return exit(prev);
            }
            var yielded;
            try{
                yielded = genObj.next(prev);
            }catch (err){
                return exit(err);
            }
            if(yielded.done){
                if(cb) {
                    return cb(prev);
                }

                if(genObj === rootObj){
                    return exit(prev);
                }

                return;
            }
            if(isGeneratorObj(yielded.value)){
                return doRun(yielded.value, next);
            }
            if(yielded.value instanceof Promise){
                return yielded.value.then(
                    function (result) {
                        setTimeout(next, 0, result);
                    },
                    function (err) {
                        if(!(err instanceof Error)){
                            err = new Error(err);
                        }
                        setTimeout(next, 0, err);
                    }
                );
            }
            next(yielded.value);
        }
        next();
    })(rootObj);
}

/**
 *
 * @param a
 * @returns Promise|function|Array
 */
function awync(a) {

    if(!arguments.length){
        return awaiter;
    }

    var error_handling;

    switch (a){
        case iterator:
            a = arguments[1];
            if(!a) break;
            return function *(eh) {
                for(let item of this){
                    yield awync(item, eh);
                }
            }.bind(a, arguments[2]);
        case callback:
            a = arguments[1];
            if(typeof a !== 'function') {
                throw new SyntaxError('Second argument should be callback function');
            }
            return awaiter(a);
        default:
            error_handling = arguments[1];
            if(typeof error_handling !== 'number'){
                error_handling = awync.SUPPRESS_REJECT;
            }
            break;
    }

    if(a instanceof Promise){
        return a;
    }

    if(typeof a === 'function'){

        if(isGeneratorFunc(a)){
            return new Promise((resolve, reject) => {
                run(a, function (eh, result, rootObj) {
                    if(result instanceof Error){

                        if(!(eh & awync.SUPPRESS_THROW)){
                            rootObj.throw(result);
                        }

                        if(!(eh & awync.SUPPRESS_REJECT)) {
                            reject(result);
                        } else {
                            resolve(result);
                        }

                        return;
                    }

                    resolve(result);

                }.bind(void 0, error_handling));
            });
        }

        return awync(awync.callback, a, error_handling);
    }
    if(typeof a === 'object' && a !== null){
        if(Array.isArray(a)){
            return Promise.race(a.map(item => awync(item, error_handling)));
        }

        if(typeof a[Symbol.iterator] === 'function'){
            return awync(iterator, a, error_handling);
        }

        return Object.keys(a).reduce(
            (prev, cur) => {
                prev[cur] = awaiter(a[cur]);
                return prev;
            },
            {}
        );
    }

    throw new SyntaxError('Object, function or array expected');
}
awync.iterator = iterator;
awync.callback = callback;
awync.SUPPRESS_THROW = 1;
awync.SUPPRESS_REJECT = 2;
awync.SUPPRESS = 3;

Object.defineProperties(awync, {
    iterator: {
        value: iterator,
        __proto__: null,
        enumerable: false,
        writable: false,
        configurable: false
    },
    callback: {
        value: callback,
        __proto__: null,
        enumerable: false,
        writable: false,
        configurable: false
    }
});
module.exports = awync;