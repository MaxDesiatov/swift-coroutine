function* gen() {
  let i = 0;
  while (true) {
    yield i;
    ++i;
  }
}

for (const x of gen()) {
  if (x > 5) {
    break;
  } else {
    console.log(`generator item ${x}`);
  }
}

function* coro() {
  console.log('coro started execution');
  let input;
  while (true) {
    let output = `string ${input}`;
    console.log(`output is ${output}`);
    input = yield output;
    console.log(`input is ${input}`);
  }
}

let c = coro();
c.next();

console.log('just before the for loop');
for (const x of [1,2,3,4,5]) {
  console.log(`sending ${x} to coroutine`);
  console.log(`coro just yielded ${c.next(x).value}`);
}

const isPromise = obj => Boolean(obj) && typeof obj.then === 'function';

const next = (iter, callback, prev = undefined) => {
  const item = iter.next(prev);
  const value = item.value;

  if (item.done) return callback(prev);

  if (isPromise(value)) {
    value.then(val => {
      setImmediate(() => next(iter, callback, val));
    });
  } else {
    setImmediate(() => next(iter, callback, value));
  }
};

const promisify = (fn) =>
  (...args) => new Promise(
    resolve => {
      next(fn(...args), val => resolve(val));
    }
  );

/* How to use gensync() */

const fetchSomething = () => new Promise((resolve) => {
  setTimeout(() => resolve('future value'), 500);
});

const asyncFunc = promisify(function* () {
  const result = yield fetchSomething(); // returns promise

  // waits for promise and uses promise result
  yield result + ' 2';
});

// Call the async function and pass params.
asyncFunc('param1', 'param2', 'param3')
  .then(val => console.log(val)); // 'future value 2'

//
//async function <name>?<argumentlist><body>
//=>
//function <name>?<argumentlist>{ return spawn(function*() <body>, this); }

// taken from http://tc39.github.io/ecmascript-asyncawait/#desugaring
function spawn(genF, self) {
  return new Promise(function(resolve, reject) {
    var gen = genF.call(self);
    function step(nextF) {
      var next;
      try {
        next = nextF();
      } catch(e) {
        // finished with failure, reject the promise
        reject(e);
        return;
      }
      if(next.done) {
        // finished with success, resolve the promise
        resolve(next.value);
        return;
      }
      // not finished, chain off the yielded promise and `step` again
      Promise.resolve(next.value).then(function(v) {
        step(function() { return gen.next(v); });
      }, function(e) {
        step(function() { return gen.throw(e); });
      });
    }
    step(function() { return gen.next(undefined); });
  });
}

function sleeper(timeout) {
  const f = function*() {
    yield;
  }();

  const g = function*() {
    console.log('before yield');
    yield f.next();
    console.log('after yield');
  }();

  setTimeout(() => {
    console.log('sleeper timeout passed');
    f.next();
  }, timeout);

  return g;
}

const http = require('http');

function httpGet() {
  const f = function*() {
    let input = yield;
    yield input;
  }();

  const g = function*() {
    yield f.next();
  }();

  console.log('before http.get');
  http.get('http://nodejs.org/dist/index.json', ({ statusCode }) => {
    console.log(`got status code ${statusCode}`);
    f.next(statusCode);
  });

  return g;
}

function* sleeperExample() {
  console.log('before sleep');
  yield* sleeper(2000);

  console.log('before httpGet');
  const statusCode = yield* httpGet();

  console.log(`after sleep status code is ${statusCode}`);
}

const e = sleeperExample();

let done;
do {
  console.log('sleeperExample iteration');
  done = e.next().done;
  console.log(`done is ${done}`)
} while (!done);

setTimeout(() => console.log('5 seconds passed after sleeperExample start'), 5000);


http.get('http://nodejs.org/dist/index.json', ({ statusCode }) => {
  console.log(`free get got status code ${statusCode}`);
}).on('error', (e) => {
  console.error(`Got error: ${e.message}`);
});;
