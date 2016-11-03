/**
 * Created by tolgahan on 03.11.2016.
 */
"use strict";
const proxies = new Map();

function awaiter(obj) {
    if(proxies.has(obj)){
        return proxies.get(obj);
    }
    var proxy = new Proxy(obj, {
        get: function (target, prop) {
            var v = target[prop];
            if(typeof v === 'function'){
                return function *() {
                    var args = Array.prototype.slice.call(arguments);
                    yield new Promise((resolve, reject) => {
                        args.push(function () {
                            var response = Array.prototype.slice.call(arguments);
                            if(response[0] instanceof Error){
                                reject(response.length <= 2 ? response[0] : response);
                            } else {
                                resolve(response.length <= 2 ? response[1] : response);
                            }
                        });
                        v.apply(target, args);
                    });
                };
            }
        }
    });

    proxies.set(obj, proxy);
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
    return (function doRun(genObj, cb) {
        function next(prev) {
            if(prev instanceof Error){
                return setTimeout(function (err) {
                    rootObj.throw(err);
                }, 0, prev);
            }
            var yielded;
            try{
                yielded = genObj.next(prev);
            }catch (err){
                return setTimeout(function (err) {
                    rootObj.throw(err);
                }, 0, err);
            }
            if(yielded.done){
                if(cb) cb(prev);
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
    if(typeof a === 'object'){
        if(Array.isArray(a)){
            return a.map(item => awync(item));
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
module.exports = awync;