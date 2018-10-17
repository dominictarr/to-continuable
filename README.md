# to-continuable

convert a value to a [continuable](https://github.com/raynos/continuable)

Supports:
  * primitive values: numbers, strings, boolean, null, undefined
  * nested structures, {} or []
  * pull-streams (Sources)
  * continuables

A function with two args is assumed to be a Source pull-stream.
A function with just one arg is assumed to be a continuable.

Objects are ensured to have the same key order on the way out as on the way in.

## example

```
var toContinuable = require('to-continuable')

toContinuable(obj) (function (err, value) {
  //...
})
``

100% test coverage!


## License

MIT

