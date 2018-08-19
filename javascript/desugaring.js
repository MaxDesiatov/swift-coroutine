function beginAsync(coro) {
}

function suspendAsync(closure) {
}

function delayed(result, timeout, cb) {
  // a callback called immediately here will cause this error:
  // TypeError: Generator is already executing.
  // which makes sense, because with beginAsync the callback
  // will try to resume the coroutine within this same running coroutine,
  // which is invalid
  // cb();
  setTimeout(() => cb(result), timeout);
}

async function delayedAsync(result, timeout) {
  return new Promise((resolve) => setTimeout(() => resolve(result), timeout));
}

async function nested() {
  await delayedAsync('result3', 1000);
  console.log(`result3 ready at ${new Date()}`);

  await delayedAsync('result4', 1000);
  console.log(`result4 ready at ${new Date()}`);
}

beginAsync(async () => {
  const result1 = await suspendAsync((c) =>
    delayed('result1', 1000, (v) => c(v))
  );
  console.log(`result1 ready at ${new Date()}`);

  const result2 = await suspendAsync((c) =>
    delayed('result2', 1000, (v) => c(v))
  );
  console.log(`result2 ready at ${new Date()}`);

  const result3 = await nested();

  console.log(`${result1} ${result2} ${result3}`);
});

// code above can be desugared into this coroutines code:

let async1;
let async2;

const coro = function* () {
  async1();
  const result1 = yield;
  console.log(`result1 ready at ${new Date()}`);

  async2();
  const result2 = yield;
  console.log(`result2 ready at ${new Date()}`);

  console.log(`${result1} ${result2}`);
}();

async1 = () => delayed('result1', 1000, (v) => coro.next(v));
async2 = () => delayed('result2', 1000, (v) => coro.next(v));

coro.next();