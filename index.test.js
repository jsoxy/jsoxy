const Jsoxy = require('./index.js');

test('fail to start without a target', () => {
  expect(() => { new Jsoxy(); }).toThrow();
});
