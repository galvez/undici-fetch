'use strict'

const tap = require('tap')
const {
  Headers,
  normalizeAndValidateHeaderName,
  normalizeAndValidateHeaderValue
} = require('../src/headers')

tap.test('Headers initialization', t => {
  t.plan(5)

  t.test('allows undefined', t => {
    t.plan(1)

    t.notThrow(() => new Headers())
  })

  t.test('with array of header entries', t => {
    t.plan(2)

    t.test('fails with odd length init child', t => {
      t.plan(1)
      const init = [['undici', 'fetch'], ['fetch']]
      t.throw(() => new Headers(init), TypeError('header entry must be of length two'))
    })

    t.test('allows even length init', t => {
      t.plan(1)
      const init = [['undici', 'fetch'], ['fetch', 'undici']]
      t.notThrow(() => new Headers(init))
    })
  })

  t.test('with object of header entries', t => {
    t.plan(1)
    const init = {
      undici: 'fetch',
      fetch: 'undici'
    }
    t.notThrow(() => new Headers(init))
  })

  t.test('fails silently if a boxed primitive object is passed', t => {
    t.plan(3)
    /* eslint-disable no-new-wrappers */
    t.notThrow(() => new Headers(new Number()))
    t.notThrow(() => new Headers(new Boolean()))
    t.notThrow(() => new Headers(new String()))
    /* eslint-enable no-new-wrappers */
  })

  t.test('fails silently if function or primitive is passed', t => {
    t.plan(4)
    t.notThrow(() => new Headers(Function))
    t.notThrow(() => new Headers(function () {}))
    t.notThrow(() => new Headers(1))
    t.notThrow(() => new Headers('1'))
  })
})

tap.test('Headers append', t => {
  t.plan(3)

  t.test('adds valid header entry to instance', t => {
    t.plan(2)
    const headers = new Headers()

    const name = 'undici'
    const value = 'fetch'
    t.notThrow(() => headers.append(name, value))
    t.strictEqual(headers.get(name), value)
  })

  t.test('adds valid header to existing entry', t => {
    t.plan(3)
    const headers = new Headers()

    const name = 'undici'
    const value1 = 'fetch1'
    const value2 = 'fetch2'
    headers.append(name, value1)
    t.strictEqual(headers.get(name), value1)
    t.notThrow(() => headers.append(name, value2))
    t.strictEqual(headers.get(name), [value1, value2].join(', '))
  })

  t.test('throws on invalid entry', t => {
    t.plan(3)
    const headers = new Headers()

    t.throw(() => headers.append(), 'throws on missing name and value')
    t.throw(() => headers.append('undici'), 'throws on missing value')
    t.throw(() => headers.append('invalid @ header ? name', 'valid value'), 'throws on invalid name')
  })
})

tap.test('Headers delete', t => {
  t.plan(2)

  t.test('deletes valid header entry from instance', t => {
    t.plan(3)
    const headers = new Headers()

    const name = 'undici'
    const value = 'fetch'
    headers.append(name, value)
    t.strictEqual(headers.get(name), value)
    t.notThrow(() => headers.delete(name))
    t.strictEqual(headers.get(name), null)
  })

  t.test('throws on invalid entry', t => {
    t.plan(2)
    const headers = new Headers()

    t.throw(() => headers.delete(), 'throws on missing namee')
    t.throw(() => headers.delete('invalid @ header ? name'), 'throws on invalid name')
  })
})

tap.test('Headers get', t => {
  t.plan(3)

  t.test('returns null if not found in instance', t => {
    t.plan(1)
    const headers = new Headers()

    t.strictEqual(headers.get('undici'), null)
  })

  t.test('returns header values from valid header name', t => {
    t.plan(2)
    const headers = new Headers()

    const name = 'undici'; const value1 = 'fetch1'; const value2 = 'fetch2'
    headers.append(name, value1)
    t.strictEqual(headers.get(name), value1)
    headers.append(name, value2)
    t.strictEqual(headers.get(name), [value1, value2].join(', '))
  })

  t.test('throws on invalid entry', t => {
    t.plan(2)
    const headers = new Headers()

    t.throw(() => headers.get(), 'throws on missing name')
    t.throw(() => headers.get('invalid @ header ? name'), 'throws on invalid name')
  })
})

tap.test('Headers has', t => {
  t.plan(2)

  t.test('returns boolean existance for a header name', t => {
    t.plan(2)
    const headers = new Headers()

    const name = 'undici'
    t.strictEqual(headers.has(name), false)
    headers.append(name, 'fetch')
    t.strictEqual(headers.has(name), true)
  })

  t.test('throws on invalid entry', t => {
    t.plan(2)
    const headers = new Headers()

    t.throw(() => headers.has(), 'throws on missing name')
    t.throw(() => headers.has('invalid @ header ? name'), 'throws on invalid name')
  })
})

tap.test('Headers set', t => {
  t.plan(3)

  t.test('sets valid header entry to instance', t => {
    t.plan(2)
    const headers = new Headers()

    const name = 'undici'
    const value = 'fetch'
    t.notThrow(() => headers.set(name, value))
    t.strictEqual(headers.get(name), value)
  })

  t.test('overwrites existing entry', t => {
    t.plan(4)
    const headers = new Headers()

    const name = 'undici'
    const value1 = 'fetch1'
    const value2 = 'fetch2'
    t.notThrow(() => headers.set(name, value1))
    t.strictEqual(headers.get(name), value1)
    t.notThrow(() => headers.set(name, value2))
    t.strictEqual(headers.get(name), value2)
  })

  t.test('throws on invalid entry', t => {
    t.plan(3)
    const headers = new Headers()

    t.throw(() => headers.set(), 'throws on missing name and value')
    t.throw(() => headers.set('undici'), 'throws on missing value')
    t.throw(() => headers.set('invalid @ header ? name', 'valid value'), 'throws on invalid name')
  })
})

tap.test('Headers as Iterable', t => {
  t.plan(5)

  t.test('returns combined and sorted entries using .forEach()', t => {
    t.plan(12)
    const init = [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
      ['abc', '4'],
      ['b', '5']
    ]
    const expected = [
      ['a', '1'],
      ['abc', '4'],
      ['b', '2, 5'],
      ['c', '3']
    ]
    const headers = new Headers(init)
    const that = {}
    let i = 0
    headers.forEach(function (value, key, _headers) {
      t.strictDeepEqual(expected[i++], [key, value])
      t.strictEqual(headers, _headers)
      t.equal(this, that)
    }, that)
  })

  t.test('returns combined and sorted entries using .entries()', t => {
    t.plan(4)
    const init = [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
      ['abc', '4'],
      ['b', '5']
    ]
    const expected = [
      ['a', '1'],
      ['abc', '4'],
      ['b', '2, 5'],
      ['c', '3']
    ]
    const headers = new Headers(init)
    let i = 0
    for (const header of headers.entries()) {
      t.strictDeepEqual(header, expected[i++])
    }
  })

  t.test('returns combined and sorted keys using .keys()', t => {
    t.plan(4)
    const init = [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
      ['abc', '4'],
      ['b', '5']
    ]
    const expected = ['a', 'abc', 'b', 'c']
    const headers = new Headers(init)
    let i = 0
    for (const key of headers.keys()) {
      t.strictDeepEqual(key, expected[i++])
    }
  })

  t.test('returns combined and sorted values using .values()', t => {
    t.plan(4)
    const init = [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
      ['abc', '4'],
      ['b', '5']
    ]
    const expected = ['1', '4', '2, 5', '3']
    const headers = new Headers(init)
    let i = 0
    for (const value of headers.values()) {
      t.strictDeepEqual(value, expected[i++])
    }
  })

  t.test('returns combined and sorted entries using for...of loop', t => {
    t.plan(4)
    const init = [
      ['a', '1'],
      ['b', '2'],
      ['c', '3'],
      ['abc', '4'],
      ['b', '5']
    ]
    const expected = [
      ['a', '1'],
      ['abc', '4'],
      ['b', '2, 5'],
      ['c', '3']
    ]
    let i = 0
    for (const header of new Headers(init)) {
      t.strictDeepEqual(header, expected[i++])
    }
  })
})

tap.test('Headers normalize and validate', t => {
  t.plan(2)
  const name = 'UNDICI'
  const value = '    fetch	' // eslint-disable-line no-tabs
  t.strictEqual(
    normalizeAndValidateHeaderName(name),
    'undici'
  )
  t.strictDeepEqual(
    normalizeAndValidateHeaderValue(name, value),
    ['undici', 'fetch']
  )
})
