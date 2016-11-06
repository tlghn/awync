/**
 * Created by tolgahan on 03.11.2016.
 */

const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const assert = chai.assert;
const {indent, outdent, comment} = require('./_init');

describe('API', function () {

    describe('Calling awync without arguments: awync()', function () {

        comment(
            'When you call awync without arguments, call will return as a ' +
            'function named "awaiter".\nAwaiter function is designed for ' +
            'creating generators. That generators is required to simulate ' +
            'await by using yield statement'
        );

        it('!awync()', function () {

            const awync = require('../');
            let awaiter = awync();
            assert(typeof awaiter === 'function');
            assert(awaiter.length === 3);
        });

        describe('Awaiter Function', function () {

            comment('Signature: function awaiter(obj, target, noCache){}');

            comment('Awaiter function takes three parameters. All of these parameters are optional' +
                'Please see the expected results depending on given argument types below.');

            comment('Since awaiter function creates object proxies, it caches created proxies to avoid memory leak. ' +
                'But, you may want to pass caching for some good reasons. In that case, passing `true` for ***@noCache*** ' +
                'parameter could help you to get what you need');


            comment('If you call awaiter with a FUNCTION parameter then awaiter will consider that FUNCTION is a ' +
                'async callbak and it will transform that FUNCTION to a GeneratorFunction.', true);


            it('awaiter(Function)', function () {

                const awync = require('../');
                let generator = awync()(function () {});

                assert(typeof generator === 'function');
                assert(generator.length === 0);
                assert(generator.constructor.name === 'GeneratorFunction');
            });

            it('awaiter(GeneratorFunction)', function () {

                const awync = require('../');
                function *generator() {

                }
                let result = awync()(generator);
                assert(result === generator);
            });

            it('awaiter(Function, Object)', function () {

                const awync = require('../');
                let target = {};
                let generator = awync()(function () {
                    assert(this === target);
                }, target);

                assert(typeof generator === 'function');
                assert(generator.length === 0);
                assert(generator.constructor.name === 'GeneratorFunction');
                generator().next();
            });

            it('awaiter(Object)', function () {

                const awync = require('../');

                let host = {
                    test(){
                    }
                };

                let proxy = awync()(host);

                assert(proxy !== host);
                expect(Object.getOwnPropertyNames(proxy)).to.eql(Object.getOwnPropertyNames(host));
                assert(proxy.test.constructor.name === 'GeneratorFunction');
            });

            it('awaiter(Iterable|Primitive|null|undefined)', function () {

                const awaiter = require('../')();
                assert(awaiter(true) === true);
                assert(awaiter(1.234) === 1.234);
                assert(awaiter('test') === 'test');
                assert(awaiter(void 0) === void 0);
                assert(awaiter(null) === null);

                var set = new Set();
                var map = new Map();
                var array = [];

                assert(awaiter(set) === set);
                assert(awaiter(map) === map);
                assert(awaiter(array) === array);
            });

        });

    });




});
