class Coroutine<I, O> {
  func start() -> Self

  func next(value: I) -> O?
}

class ThrowingCoroutine<I, O> {
  func start() -> Self

  func next(value: I) throws -> O?
}

class Producer<O>: Coroutine<(), O>, LazySequenceProtocol, IteratorProtocol {
  func next() -> O?
}

class Consumer<I>: Coroutine<I, ()> {
  func next(value: I)
}

struct Countdown: Sequence, IteratorProtocol {
  var count: Int

  mutating func next() -> Int? {
    if count == 0 {
        return nil
    } else {
        defer { count -= 1 }
        return count
    }
  }
}

func* countdown(count: Int) -> Producer<Int> {
  var count = count

  while count > 0 {
    yield count
    count -= 1
  }
}