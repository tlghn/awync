# Awync
Lightweight async / await module for NodeJS (and / or) Browsers 

You have trouble with NodeJS's callback hell, don't you?

**This tiny and flexible module will save you tons of times until the next version of Javascript (ES7) comes around.**

### Features
- Single method for all configuration
- Fluent await operations with generators
- Simple usage. 
- It does not have any side effects. 


### Getting Started

There is a common problem with NodeJS called like "callback hell"

It is something like:
```
    const fs = require('fs');
    function updateFile(file, done){
        fs.access(file, fs.F_OK, function(err, result){
            if(err) return done(err);
    
            fs.readFile(file, 'utf8', function(err, fileData) {
                if(err) return done(err);
                
                // do something with file data then update
                
                fs.writeFile(file, 'utf8', fileData, function(err) {
                    if(err) return done(err);
                    done();
                });
            });
        });
    }
    
    updateFile(file, function(err){
        if(err){
            return console.log('Error %s', err)
        }
        console.log('saved');
    });
```


On ES7 (aka ES2017) this issue will be solved with async & await operations.
The proposed pattern is like this:

```
    const fs = require('fs');
    async function updateFile(file) {
        await fs.accessAsync(file);
        var fileData = await fs.readFileAsync(file, 'utf8');
        // do something with fileData
        await fs.writeFileAsync(file, 'utf8');
    }
    
    (async function() {
        try{
            await updateFile(file);
            console.log('saved');
        }catch(err){
            console.log('Error %s', err)
        }
    })();

```

Easy, right ?

But, NodeJS currently does not have support for ES7 syntax.
There are many other solutions focused on this issue. 
Most common solution is transpiling ES7 code to supported environment (currently it is ES6)
Since it is not natively supported, I do not prefer that.

Then, What is my solution ?

This tiny module aiming to cover this issue by using ES6's generators.
With awync the code above will be written like this:

```
    const awync = require('awync');
    const fs = awync()(require('fs'));
    
    function *updateFile(file) {
        yield await.fs.access(file);
        var fileData = yield fs.readFile(file, 'utf8');
        // do something with fileData
        yield fs.writeFile(file, 'utf8');
    }
    
    awync(function*(){
        try{
            yield updateFile(file);
            console.log('saved');
        }catch(err){
            console.log('Error %s', err)
        }
    });

```




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


### How CALLBACKs will be yielded ?


When you await a CALLBACK the result will be
- If err argument is instance of Error then generator will throw that error and will cancel current execution scope.
And all of passed arguments (including err argument) will be attached to the error with name "args". so, check `err.args` for all arguments
- If err argument is null or undefined then result parameter will be yielded.


```
    try{
        var a = await.fs.lstat(filename);
        // result is set to a
    } catch (err) {
        // err is here
        // see err.args for all arguments passed to lstat function
    }
```


- If err argument does not fit the rules above then yielded value will be an array of all passed arguments

```
    // npm i awync-events --save
    
    const EventEmitter = require('awync-events');
    var ee = new EventEmitter();

    awync(function *(){
        var args = yield ee.when.test();
        console.log(args);
        // output will be 1, 2, 3, 4, 5
    });
    
    setTimeout(function(){
        ee.emit('test', 1,2,3,4,5);
    }, 1000);
```





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
- 1.1.2
    - Better promise handling
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

### Releated Links

- **[awync-events](https://www.npmjs.com/package/awync-events)**: Awync EventEmitter module