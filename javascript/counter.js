function* counter() {
  let i = -1;
  let input;
  while (true) {
    input = yield `${i}: ${input}`;
    i += 1;
  }
}

const c = counter();
c.next();
