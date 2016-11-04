/**
 * Created by tolgahan on 03.11.2016.
 */
"use strict";
const proxies = new Map();
const ITER = Symbol('ITER');
const VAL = Symbol('VAL');
const iterator = Symbol('iterator');
const callback = Symbol('callback');

function awaiter(obj, noCache) {
    if(typeof obj === 'function'){
        if(isGeneratorFunc(obj)){
            return obj;
        }
        return awaiter({obj}, true).obj;
    }

    if(proxies.has(obj)){
        return proxies.get(obj);
    }

    if(!obj || typeof obj !== 'object' || Array.isArray(obj) || typeof obj[Symbol.iterator] === 'function'){
        return obj;
    }

    var proxy = new Proxy(obj, {
        get: function (target, prop) {
            var v = target[prop];
            if(typeof v === 'function'){

                if(isGeneratorFunc(v)){
                    return v;
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
                        v.apply(target, args);
                    });
                };
            }


            return awaiter(v, true);
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

function run(genFunc) {
    var rootObj = genFunc();
    var timeout = setTimeout(() =>{}, 0x7FFFFFFF);
    function exit(result) {
        clearTimeout(timeout);
        if(result instanceof Error){
            setTimeout(err => rootObj.throw(err), 0, result);
        }
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
                    next
                ).catch(function (err) {
                    if(!(err instanceof Error)){
                        err = new Error(err);
                    }
                    next(err);
                });
            }
            next(yielded.value);
        }
        next();
    })(rootObj);
}

function awync(a) {

    if(!arguments.length){
        return awaiter;
    }

    switch (a){
        case iterator:
            a = arguments[1];
            if(!a) break;
            return function *() {
                for(let item of this){
                    yield awaiter(item, true);
                }
            }.bind(a);
        case callback:
            a = arguments[1];
            if(typeof a !== 'function') {
                throw new SyntaxError('Second argument should be callback function');
            }
            return awaiter(a);
    }

    if(a instanceof Promise){
        return run(function *(a) {
            yield a;
        }.bind(null, a));
    }
    if(typeof a === 'function'){
        if(isGeneratorFunc(a)){
            return run(a);
        }
        return run(function *(a) {
            yield a();
        }.bind(null, a));
    }
    if(typeof a === 'object' && a !== null){
        if(Array.isArray(a)){
            return a.map(item => awync(item));
        }

        if(typeof a[Symbol.iterator] === 'function'){
            return awync(iterator, a);
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