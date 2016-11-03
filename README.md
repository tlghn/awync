# Awync
Lightweight async / await module for NodeJS (and / or) Browsers **(#100# lines only)**

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

### Usage ?

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

#### How about Promises ?

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

#### How about inner generators?

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



#### How about errors ?

Only the root method is resposible for error handling. 
So a simple try catch will be enough for all!

```
    const awync = require('awync');

    function *generatorA() {
        throw new Error("test");
    }
    
    function *generatorB() {
        yield generatorA();
    }
    
    function *generatorC() {
        yield generatorB();
    }
    
    awync(function *() {
        try{
            yield generatorC();
        }catch (err){
            console.log(err.message);
            // Output will be "test";
        }
    });
    
```


### Any issues or new ideas ? 

Fork on github: [https://github.com/tlghn/awync.git](https://github.com/tlghn/awync.git)