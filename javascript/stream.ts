import { openSync, readSync, writeFileSync } from 'fs';

function* chunkReader(path: string, chunkSize: number,
start: number = 0) {
  // 'r' - Open file for reading.
  // An exception occurs if the file does not exist.
  const fileDescriptor = openSync(path, 'r');
  let offset = start;
  let bytesRead: number;
  const buffer = Buffer.alloc(chunkSize);
  do {
    // returns `buffer` from `.next()` call below
    // and suspends until `.next()` is called again
    bytesRead = readSync(fileDescriptor, buffer, 0, chunkSize, offset);
    yield buffer.toString();
    offset += chunkSize;
  } while (bytesRead);
}

// generating test data: a range of integers from 0 to 41
const testData = JSON.stringify([...Array(42).keys()]);
writeFileSync('test.txt', testData);

// a sequence of chunks from 'test.txt'
const stream = chunkReader('test.txt', 5);
// first stream chunk
console.log(stream.next());
// prints `{ value: '[0,1,', done: false }`

// resume the coroutine and print next 5 chunks
for (let i = 0; i < 5; ++i) {
  console.log(stream.next().value);
}
// prints
// 2,3,4
// ,5,6,
// 7,8,9
// ,10,1
// 1,12,

// The coroutine is still alive, but suspended
// and can be resumed later when needed. Like this:
console.log(stream.next().value);
// prints `13,14`

try {
  // the error will be thrown at `yield`
  // in `sequence` body and bubble up here
  stream.throw(new Error('blah'));
} catch (e) {
  console.log(e);
  // prints `Error: blah`
}

// the coroutine is done now
console.log(stream.next());
// prints `{ value: undefined, done: true }`

// Parses characters passed via '.next()', yields parsed integers
// or `undefined` if no token is emitted for a character.
// Throws an error on bad input.
function* arrayParser() {
  // integer digits are accumulated in a buffer before they're parsed
  let acc = '';
  let input = yield;

  // JSON arrays start with '['
  if (input !== '[') {
    throw new Error('expected "["');
  }

  // a value to yield
  let value;
  // spaces aren't permitted between digits,
  // so we need a special flag to handle it
  let previousIsSpace = false;

  // flushes accumulated buffer
  function flush() {
    // integer digits parsed
    value = parseInt(acc, 10);
    acc = '';
  }

  // iterate over all input characters
  do {
    input = yield value;
    // resetting next value to yield
    value = undefined;

    // special handling for whitespace
    if (!input.match(/[\n\r\t ]/)) {
      if (input === ',') {
        if (acc.length) {
          flush();
        } else if (!previousIsSpace) {
          // a comma can only follow a digit or a space
          const msg = 'expected a digit or a space'
          throw new Error(msg);
        }
      } else if (input >= '0' && input <= '9'
      // this checks for cases like '[1 1]'
      && !(previousIsSpace && acc.length)) {
        // is a digit
        acc += input;
      } else if (input === ']') {
        // array ends here
        flush();
        break;
      } else {
        throw 'unexpected input';
      }
      previousIsSpace = false;
    } else {
      previousIsSpace = true;
    }
  } while (input);

  // yielding last value after array ends
  yield value;
}

const parser = arrayParser();

// kickstarting the coroutine
parser.next();

// parsing a test string
for (const char of '[1, 2,3,4,5 , 42]') {
  const result = parser.next(char).value;

  if (result) console.log(result);
  // prints lines with 1 2 3 4 5 42
}