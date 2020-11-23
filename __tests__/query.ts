import { createQuery } from '../lib/query'

test('basic', () => {
    const query = createQuery()

    query`CURRENT_TIMESTAMP`

    expect(query.tape).toMatchInlineSnapshot(`
        Object {
          "a": "data",
          "c": Object {
            "[[\\"CURRENT_TIMESTAMP\\"]]": Object {
              "a": "a1",
              "miss": true,
              "t": 0,
              "used": true,
            },
          },
          "count": 1,
          "miss": true,
          "t": 1,
          "used": true,
        }
    `)
})

test('immutable', () => {
    const tape = {
        a: 'data',
        t: 1,
        count: 0,
        c: {
            '[["CURRENT_TIMESTAMP"]]': {
                t: 0,
                a: 'a1',
            },
        },
    }
    const data = {
        a1: '420',
    }
    const query = createQuery(tape, data, false)

    expect(query`CURRENT_TIMESTAMP`).toBe('420')

    expect(() => query`WUMBO`).toThrow()
})

test('immutable + uncached callback', () => {
    const tape = {
        a: 'data',
        t: 1,
        count: 0,
        c: {
            '[["CURRENT_TIMESTAMP"]]': {
                t: 0,
                a: 'a1',
            },
        },
    }
    const data = {
        a1: '420',
    }
    const mockFn = jest.fn()
    const query = createQuery(tape, data, false, mockFn)

    expect(query`CURRENT_TIMESTAMP`).toBe('420')
    expect(mockFn).not.toBeCalled()
    expect(() => query`WUMBO`).not.toThrow()
    expect(mockFn).toBeCalled()
})
