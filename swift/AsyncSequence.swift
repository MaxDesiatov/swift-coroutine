protocol AsyncSequence {
  associatedtype Iterator: AsyncIteratorProtocol
  // ... all other async sequence methods here
  func makeIterator() -> Self.Iterator
}

protocol AsyncIteratorProtocol {
  associatedtype Element

  mutating func next() async -> Self.Element?
}

extension AsyncSequence where Self: AsyncIteratorProtocol {
  func makeIterator() -> Self {
    return self
  }
}

struct AsyncLineReader: AsyncSequence, AsyncIteratorProtocol {
  init(filepath: String)

  mutating func next() async -> String?
}

let r = AsyncLineReader(filepath: "input.txt")

beginAsync {
  await for line in r {
    print(r)
  }
}

// desugared to:

beginAsync {
  while let line = await r.next() {
    print(r)
  }
}
