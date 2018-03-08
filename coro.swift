// option 1: output typed, input untyped

class Coroutine<T> {
  func start()

  func next(value: Any? = nil) -> T
}

class ThrowingCoroutine<T> {
  func start()

  func next(value: Any? = nil) throws -> T
}

coro example1() -> Coroutine<String> {
  var input: Any?
  while true {
    guard let i = input as? CustomStringConvertible else { yield "" }

    input = yield i.description
  }
}

let c: Coroutine<String> = example1()
c.start()

print(c.next(5))    // prints "5"
print(c.next(true)) // prints "true"
print(c.next())     // prints empty string

// option 2: input and output typed

coro example2() -> Coroutine<Int, String> {
  var input: Int?
  while true {
    input = yield (input?.description ?? "")
  }
}