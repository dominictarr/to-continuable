var Collect = require('pull-stream/sinks/collect')

function isPrimitive (v) {
  return 'string' === typeof v || 'number' === typeof v || 'boolean' === typeof v || null === v || undefined === v
}

function isFunction (f) {
  return 'function' === typeof f
}

function isNestedAsync(v) {
  if(isPrimitive(v)) return false
  if(isFunction(v)) return true
  for(var k in v)
    if(isNestedAsync(v[k])) return true
  return false
}

function toCont(value) {
  return function (cb) {
    if(isFunction(value)) {
      var inCB = false
      function _cb (err, value) {
        inCB = true
        cb(err, value)
      }
      try {
        if(value.length === 1) return value(_cb) //already a continuable
        else if(value.length === 2) return Collect(_cb)/*(Map(toCont))*/(value)
      } catch(err) {
        if(!inCB) return cb(err)
        else throw err
      }
      _cb(new Error('expected function arity 1 or 2, was:'+value.length+' on :'+value))
    }
    else if(isPrimitive(value))
      return cb(null, value)
    else {
      var obj = Array.isArray(value) ? [] : {}
      var n = 1, c = 0
      for(var k in value) (function (key, _value) {
        if(isPrimitive(_value))
          obj[key] = _value
        else {
          n++, c++
          toCont(_value)(function (err, __value) {
            if(isNestedAsync(__value))
              toCont(__value)(function (err, ___value) {
                obj[key] = ___value
                done(err)
              })
            else {
              obj[key] = __value
              done(err)
            }
          })
        }
      })(k, value[k])
      done()
      function done (err) {
        if(err && n >= 0)
          return n = -1, cb(err)
        else if(--n) return

        //if it was an {}, and there was at least one continuable inside
        //then make sure keys are in the same order.
        if(!Array.isArray(value) && c) {
          var _obj = {}
          for(var k in value)
            _obj[k] = obj[k]
          obj = _obj
        }
        cb(null, obj)
      }
    }
  }
}

module.exports = toCont

