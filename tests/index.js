/**
 * Created by tolgahan on 03.11.2016.
 */

const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const assert = chai.assert;
const awync = require('../');
const fs = require('fs');

describe('Initialization', function () {
    it('Create Awaiter', function () {
        const awaiter = awync({fs});

        should.exist(awaiter);
        should.exist(awaiter.fs);
        expect(awaiter.fs.lstat.constructor.name).to.equal('GeneratorFunction');
    });
});

describe('Runtime', function () {
    it('Should throw SyntaxError', function () {
        try {
            awync(true);
            assert.fail();
        }catch (err) {
            assert.instanceOf(err, SyntaxError);
        }
    });

    it('Should accept inline functions', function (done) {
        awync(function () {
            done();
        });
    });

    it('Should accept generators', function (done) {
        awync(function *() {
            done();
        });
    });

    it('Should accept generator array', function (done) {
        awync([
            function *() {

            },
            function *() {
                done();
            }
        ]);
    });

    it('Should execute inner generators', function (done) {
        awync(function *() {
            yield (function *() {
                done();
            })();
        })
    });

    it('Should throw error in root generator', function (done) {
        function *generatorA() {
            throw new Error("test");
        }
        awync(function *() {
            try{
                yield generatorA();
                assert.fail();
            }catch (err){
                expect(err.message).to.equal('test');
            }
            done();
        });
    });

    it('Should execute one by one', function (done) {
        awync(function *() {
            var start = Date.now();
            yield new Promise(resolve => setTimeout(resolve, 100));
            var phrase = Date.now();
            yield new Promise(resolve => setTimeout(resolve, 100));
            var end = Date.now();
            expect(phrase - start).to.gte(90);
            expect(end - phrase).to.gte(90);
            expect(end - start).to.gte(180);
            done();
        })
    });

    it('Should execute parallel', function (done) {
        var count = 2;

        awync([function *() {
            setTimeout(function () {
                count--;
            }, 100);
        }, function *() {
            setTimeout(function () {
                count--;
            }, 100);
        }]);

        setTimeout(function () {
            expect(count).to.equal(0);
            done();
        }, 150);

    });

    it('Read / write file', function (done) {
        var await = awync({fs});
        awync(function *() {
            var jsonString = JSON.stringify({key:'value'});

            // write the file
            yield await.fs.writeFile('./file.json', jsonString, 'utf8');

            // read the file
            var someString = yield await.fs.readFile('./file.json', 'utf8');

            // delete file
            yield await.fs.unlink('./file.json');

            assert(jsonString === someString);

            // next

            done();
        })
    });

    it('Promise test', function (done) {
        awync(function *() {

            yield new Promise(resolve => {
                setTimeout(() => {
                    console.log('This comment will be on 1st line. Date: %s', new Date());
                    resolve();
                }, 2500);
            });


            // See the timeout delay below. It is 1500, and the above one is 2500.
            // But the below one will be executed later
            yield new Promise(resolve => {
                setTimeout(() => {
                    console.log('This comment will be on 2nd line. Date: %s', new Date());
                    resolve();
                }, 1500);
            });

            yield new Promise(resolve => {
                setTimeout(() => {
                    console.log("This comment will be on 3rd line. Date: %s", new Date());
                    resolve();
                }, 3000);
            });

            // next operations...
            done();
        });
    }).timeout(8000);

    it('Loop test', function (done) {

        function *generatorA(name, delay = 1000){
            yield new Promise(resolve => {
                setTimeout(() => {
                    console.log('Hello %s on %s', name, new Date());
                    resolve();
                }, delay);
            });
        }

        function *generatorB(count = 1){
            yield generatorA('Friend ' + count);
            yield generatorA('World ' + count);
        }


        function *generatorC(){
            for(var i=0; i<5; i++){
                yield generatorB(i);
            }
        }

        awync(function *() {

            yield generatorC();

            // next operations...
            done();
        });

    }).timeout(11000);
});