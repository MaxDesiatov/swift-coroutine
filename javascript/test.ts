function* blah(x) {
  if (x) {
    return;
  }
  try {
    for (let i = 0; i < 10; ++i) {
      console.log(yield);
    }
    yield 'blah';
  } catch (e) {
    console.log(e);
  }
}