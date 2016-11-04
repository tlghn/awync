# Awync
Lightweight async / await module for NodeJS (and / or) Browsers 
**(unminified version is only 173 lines)**

You have trouble with NodeJS's callback hell, don't you?

**This tiny and flexible module will save you tons of times until the next version of Javascript (ES7) comes around.**

### Features
- Single method for all configuration
- Fluent await operations with generators
- Simple usage. 
- It does not have any side effects. 


### Installation

```
    npm i awync --save
```


### How It Works ?

So, NodeJS has a design pattern (Does it? Not sure! But every built-in library has the same callback function signature)

It is like:

```
    someLibrary.someMethod(arg1, arg2, ...argN, CALLBACK);
```

And the CALLBACK function signature is (mostly) :
```
    function(err, result) {}
```

Am I right ? Then, let's move!

So, Awync takes advantage of this pattern. (BTW, **awync** is made with **AW**ait + as**YNC**! :))
 
- It generates Promise for this CALLBACK method. 
- Executes that promise in a **Generator Function** (function*(){})
- Pushes the result as next **yield** result.
- Executes each yield iteration next after previous yield result.

### Usage

#### Basic Usage
It should be simple as possible.

```
    const awync = require('awync');
    const fs = require('fs');
    const await = awync({fs});
    
    awync(function *() {
        var jsonString = JSON.stringify({key:'value'});

        // write the file
        yield await.fs.writeFile('./file.json', jsonString, 'utf8');

        // read the file
        var someString = yield await.fs.readFile('./file.json', 'utf8');

        // delete file
        yield await.fs.unlink('./file.json');

        assert(jsonString === someString);
        
        // next operations...
    });
    
```


#### Error handling

Only the root generator is responsible for error handling. 
So a simple try catch will be enough for all!


```
    const awync = require('awync');
    const fs = awync({someKey: require('fs')}).someKey;
    
    awync(function *() {
        var file = './someFileThat.notExist';
        try{
            var stats = yield fs.lstat(file);
        }catch (err){
            console.log(err.message);
            // File not found!
            return someFunction();
        }
        
        // Interesting! File is exist. Lets delete it!
        yield fs.unlink(file);
    });
    
```



#### Promises

```
    const awync = require('awync');
    
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
            }, 1000);
        });

        
        // next operations...
    });
    
```

Simple, right ?

#### Inner Generators

```
    const awync = require('awync');

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
    });
    
```


#### Iterables, Arrays and Callbacks

Please notice the usage of `awync.iterator` and `awync.callback`

```
    const awync = require('awync');

    function asyncLog(message, startDate, delay, next) {
        delay = Math.floor(delay);
        setTimeout(function () {
            console.log(message + '[Completed after %sms (Delay was %sms)]', Date.now() - startDate, delay);
            next();
        }, delay);
    }
    
    var array = [];
    var i;
    for(i=0; i<20; i++){
        array.push(asyncLog);
    }
    var set = new Set();
    for(i=0; i<20; i++){
        // Set accepts unique values, 
        // And function.bind generates new reference
        set.add(asyncLog.bind());
    }
    
    awync(function *() {
        var date = Date.now();
    
        for(let callback of awync(awync.iterator, array)()){
            yield callback('Message from Array', date, 100);
        }
    
        console.log('\n------------- ARRAY ITERATOR COMPLETED ------------------\n');
    
        for(let callback of awync(set)()){
            yield callback('Message from Set', date, 150);
        }
    
        console.log('\n------------- SET ITERATOR COMPLETED ------------------\n');
    
        yield awync(awync.callback, asyncLog)('Message from Callback', date, 200);
    
        console.log('\n------------- CALLBACK COMPLETED ------------------\n');
    
        console.log("Done! It should completed within %sms but it completed within %sms", (array.length * 100) + (set.size * 150) + 200, Date.now() - date);
    });
    
```


#### Parallel Execution

```
    const awync = require('awync');

    var executors = [
        function *() {
            yield awync(awync.callback, function (next) {
                setTimeout(function () {
                    console.log("Executor 1");
                    next();
                }, 1000);
            })();
        },
        function *() {
            yield awync(awync.callback, function (next) {
                setTimeout(function () {
                    console.log("Executor 2");
                    next();
                }, 500);
            })();
        },
        function *() {
            yield awync(awync.callback, function (next) {
                setTimeout(function () {
                    console.log("Executor 3");
                    next();
                }, 700);
            })();
        }
    ];
    
    awync(executors);
    
    // Output will be in this order: Executor 2, Executor 3, Executor 1
    
```


## Change Log

- 1.1.1
    - Bug fix: Awaiter should only wrap non generator functions
- 1.1.0
    - Added Iterator and Callback support
    - Added support for chained references 
        `yield await.someObject.someReference.someOtherReference.someAsyncCallbac()` now works!
- 1.0.0
    - Initial release


### Any issues or new ideas ? 

Fork on github: [https://github.com/tlghn/awync.git](https://github.com/tlghn/awync.git)