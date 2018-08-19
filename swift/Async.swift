struct Coroutine<I, O> {
  func start()

  mutating func next(_ input: I) -> O
}

struct ThrowingCoroutine<I, O> {
  func start()

  mutating func next(_ input: I) throws -> O

  mutating func abort(_ error: Error)
}

/// A generator is a read-only coroutine
typealias ThrowingGenerator<O> = ThrowingCoroutine<(), O>

// pseudocode, would actually need a separate struct to add IteratorProtocol
// conformance
typealias Generator<O> = Coroutine<(), O>

func* gen() -> Generator<Int> {
  var i = 0
  while true {
    yield i
    i += 1
  }
}

func gen2() -> Generator<Int> {
  return gen()
}

func* coro() -> Coroutine<Int, String> {
  var input: Int?
  while true {
    input = yield (input?.description ?? "")
  }
}

func* coroThrows() throws -> ThrowingCoroutine<Int, String> {
  var input: Int?
  while true {
    input = yield (input?.description ?? "")

    guard input % 2 == 0 else { throw Error("odd number") }
  }
}

func* genThrows() throws -> ThrowingGenerator<Int> {
  yield* [1, 2, 3, 4, 5]
  throw Error("generator finished")
}

struct LineReader {
  init(filepath: String)

  func next() throws -> String
}

func* lineReader(filepath: String) throws -> ThrowingGenerator<String> {
  guard let file = FileHandle(forReadingAtPath: filepath) else {
    throw Error("can't open \(filepath)")
  }

  while let line = file.readLine() {
    yield line
  }
}

/// Begins an asynchronous coroutine, transferring control to `body` until it
/// either suspends itself for the first time with `suspendAsync` or completes,
/// at which point `beginAsync` returns. If the async process completes by
/// throwing an error before suspending itself, `beginAsync` rethrows the error.
func beginAsync(_ body: () async throws -> Void) rethrows -> Void

/// Suspends the current asynchronous task and invokes `body` with the task's
/// continuation closure. Invoking `continuation` will resume the coroutine
/// by having `suspendAsync` return the value passed into the continuation.
/// It is a fatal error for `continuation` to be invoked more than once.
func suspendAsync<T>(
  _ body: (_ continuation: @escaping (T) -> ()) -> ()
) async -> T

/// Suspends the current asynchronous task and invokes `body` with the task's
/// continuation and failure closures. Invoking `continuation` will resume the
/// coroutine by having `suspendAsync` return the value passed into the
/// continuation. Invoking `error` will resume the coroutine by having
/// `suspendAsync` throw the error passed into it. Only one of
/// `continuation` and `error` may be called; it is a fatal error if both are
/// called, or if either is called more than once.
func suspendAsync<T>(
  _ body: (_ continuation: @escaping (T) -> (),
           _ error: @escaping (Error) -> ()) -> ()
) async throws -> T

// 1: start of async block
beginAsync {
  // 2: not suspended yet
  let result1 = await suspendAsync { c in
    // 3: not suspended yet, but going to schedule a callback with dbQuery
    dbQuery {
      // 6: dbQuery result ready
      c($0)
    }
    // 4: dbQuery returned, suspending now
  }

  // 7: async block resumed
  let result2 = await suspendAsync { c in
    // 8: again, scheduling a callback
    httpRequest {
      // 10: httpRequest result ready
      c($0)
    }
    // 9: callback scheduled, suspending again
  }

  // 11: async block resumed after second suspendAsync continuation was called
  print([result1, result2, await intAsync()].joined(separator: " "))
}
// 5: beginAsync returns after first suspendAsync closure finished

func dbQuery(callback: @escaping (String?, Error?) -> ())
func httpRequest(callback: @escaping (String?, Error?) -> ())

func dbQueryFuture() -> Future<String>
func httpRequestFuture() -> Future<String>
func intFuture() -> Future<Int>

func dbQueryGen() -> Generator<String>
func httpRequestGen() -> Generator<String>

func intFuture() -> Future<Int>
func intGen() -> Generator<Int>
func intAsync() async -> Int

func dbQueryAsync() async -> String
func httpRequestAsync() async -> String

func* async1() -> Coroutine<String, Future<String>> {
  let result1 = yield dbQueryFuture()
  let result2 = yield httpRequestFuture()

  yield intFuture.flatMap {
    return Future([result1, result2, $0].joined(separator: " "))
  }
}

func async2() async -> String {
  let result1 = await dbQueryAsync()
  let result2 = await httpRequestAsync()
  let result3 = await intAsync()

  return [result1, result2, result3.description].joined(separator: " ")
}

func spawn<T>(_ gen: Coroutine<T, Future<T>>) -> Future<T> {

}
