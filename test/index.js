var pull = require('pull-stream')
var tape = require('tape')
var toContinuable = require('../')

var input = {
  foo: 1,
  bar: true,
  baz: 'hello',
  nothing: null,
  what: undefined,
  nested: {
    foo: 2, bar: false, baz: 'goodbye',
    more: [1,3,2,4,5,6],
    deeper: {deeper_still: {going_on_a_bear_hunt: true}}
  }
}

function insertContinuable (v, recurse) {
  return function (cb) {
    setTimeout(function () {
      cb(null, v && 'object' == typeof v && recurse ? insertContinuables(v) : v)
    })
  }
}

function insertContinuables (obj, recurse) {
  var _obj = {}
  for(var k in obj) (function (k, v) {
    if(Array.isArray(v))
      _obj[k] = pull.values(v)
    else
      _obj[k] = insertContinuable(v, recurse)
  })(k, obj[k])
  return _obj
}

tape('simple', function (t) {
  var _input = insertContinuables(input)
  toContinuable(_input)(function (err, _input) {
    t.deepEqual(_input, input)
    t.end()
  })
})

tape('recursion', function (t) {
  var _input = insertContinuables(input, true)
  toContinuable(_input)(function (err, _input) {
    t.deepEqual(_input, input)
    t.end()
  })
})

tape('primitive', function (t) {
  toContinuable(10)(function (err, v) {
    t.equal(v, 10)
    t.end()
  })
})
tape('error1', function (t) {
  var err = new Error('wtf')
  toContinuable(function (cb) {
    cb(err)
  })(function (_err, v) {
    t.equal(_err, err)
    t.end()
  })
})
tape('error2', function (t) {
  var err = new Error('wtf')
  toContinuable(function (cb) {
    setTimeout(function () { cb(err) })
  })(function (_err, v) {
    t.equal(_err, err)
    t.end()
  })
})

tape('throws', function (t) {
  var err = new Error('wtf')
  toContinuable(function (cb) {
    throw err
  })(function (_err, v) {
    t.equal(_err, err)
    t.end()
  })
})

tape('object errors', function (t) {
  var err = new Error('wtf')
  toContinuable({
    foo: true,
    bar: false,
    error: function (cb) {
      cb(err)
    }
  })(function (_err) {
    t.equal(_err, err)
    t.end()
  })
})

tape('object errors', function (t) {
  var err = new Error('wtf')
  try {
    toContinuable({
      foo: true,
      bar: false,
      error: function (cb) {
        cb(err)
      }
    })(function (_err) {
      t.ok(_err)
      throw _err
    })
  } catch (_err) {
    t.equal(_err, err)
    t.end()
  }
})

tape('incorrect function', function (t) {
  toContinuable([function () {}])(function (err) {
    t.ok(err)
    t.ok(/arity/.test(err.message))
    t.end()
  })
})

tape('array of continueables', function (t) {
  toContinuable([1,2,3].map(insertContinuable))(function (err, value) {
    if(err) throw err
    t.deepEqual(value, [1,2,3])
    t.end()
  })
})

