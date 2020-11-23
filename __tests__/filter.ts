import { sqliteCodegen } from '../lib/codegen'
import { cleanTape, createQuery, filterData, filterTape, mergeData, printWeave } from '../lib/query'

test('clean tape', () => {
    const query = createQuery()

    query`CURRENT_TIMESTAMP`

    expect(query.tape.miss).toBe(true)
    expect(query.tape.used).toBe(true)

    expect(query.tape.c!['[["CURRENT_TIMESTAMP"]]'].t).toBe(0)
    expect(query.tape.c!['[["CURRENT_TIMESTAMP"]]'].used).toBe(true)
    expect(query.tape.c!['[["CURRENT_TIMESTAMP"]]'].miss).toBe(true)

    cleanTape(query.tape)

    expect(query.tape.miss).toBe(undefined)
    expect(query.tape.used).toBe(undefined)

    expect(query.tape.c!['[["CURRENT_TIMESTAMP"]]'].used).toBe(undefined)
    expect(query.tape.c!['[["CURRENT_TIMESTAMP"]]'].miss).toBe(undefined)
})

test('filter tape (value)', () => {
    const tape = { a: 'data', t: 1, count: 0 }
    const data = {}
    const query = createQuery(tape, data, true)
    query`CURRENT_TIMESTAMP`
    mergeData(tape, data, {
        a1: '420',
    })
    expect(query`CURRENT_TIMESTAMP`).toBe('420')
    cleanTape(query.tape)
    expect(query.tape.c!['[["CURRENT_TIMESTAMP"]]'].used).toBe(undefined)
})

test('filter tape (list)', () => {
    const tape = { a: 'data', t: 1, count: 0 }
    const data = {}
    const query = createQuery(tape, data, true)
    query.many`FROM user`.map(user => {
        user`name`
    })
    mergeData(tape, data, {
        a1: [
            {
                a2: 'Kevin',
            },
            {
                a2: 'Bob',
            },
        ],
    })
    expect(() => query`FROM user`).toThrow()
    expect(printWeave(sqliteCodegen(query.tape))).toMatchInlineSnapshot(`
        "SELECT json_object(
          'a1', (SELECT json_group_array(json(a1)) FROM (SELECT json_object(
            'a2', (SELECT name)
          ) AS a1 FROM user))
        ) AS data "
    `)
    cleanTape(query.tape)

    query.many`FROM user`.map(user => {
        user`name`
        user`lastName`
    })

    expect(printWeave(sqliteCodegen(query.tape))).toMatchInlineSnapshot(`
        "SELECT json_object(
          'a1', (SELECT json_group_array(json(a1)) FROM (SELECT json_object(
            'a3', (SELECT lastName)
          ) AS a1 FROM user))
        ) AS data "
    `)

    mergeData(tape, data, {
        a1: [
            {
                a3: 'McFlurry',
            },
            {
                a3: 'Applesauce',
            },
        ],
    })

    expect(query.many`FROM user`[0]`lastName`).toBe('McFlurry')
    // cleanTape(query.tape)
    // expect(query.tape.c!['[["CURRENT_TIMESTAMP"]]'].used).toBe(undefined)
})

test('filter data (list)', () => {
    const tape = { a: 'data', t: 1, count: 0 }
    const data = {}
    const query = createQuery(tape, data, true)
    query.many`FROM user`.map(user => {
        user`name`
        user`lastName`
        const thingo = user.one`FROM thingos`
        thingo`foo`
        thingo`derp`
    })
    mergeData(tape, data, {
        a1: [
            {
                a2: 'Kevin',
                a3: 'Applesauce',
                a4: {
                    a5: 'Wumbo',
                    a6: 'Aloha',
                },
            },
            {
                a2: 'Bob',
                a3: 'McFlurry',
                a4: {
                    a5: 'Derp',
                    a6: 'Wolo',
                },
            },
        ],
    })
    cleanTape(query.tape)
    query.many`FROM user`.map(user => {
        user`name`
        const thingo = user.one`FROM thingos`
        thingo`foo`
    })

    expect(data).toMatchInlineSnapshot(`
        Object {
          "a1": Array [
            Object {
              "a2": "Kevin",
              "a3": "Applesauce",
              "a4": Object {
                "a5": "Wumbo",
                "a6": "Aloha",
              },
            },
            Object {
              "a2": "Bob",
              "a3": "McFlurry",
              "a4": Object {
                "a5": "Derp",
                "a6": "Wolo",
              },
            },
          ],
        }
    `)

    filterData(query.tape, data)
    expect(data).toMatchInlineSnapshot(`
        Object {
          "a1": Array [
            Object {
              "a2": "Kevin",
              "a4": Object {
                "a5": "Wumbo",
              },
            },
            Object {
              "a2": "Bob",
              "a4": Object {
                "a5": "Derp",
              },
            },
          ],
        }
    `)

    expect(query.tape).toMatchInlineSnapshot(`
        Object {
          "a": "data",
          "c": Object {
            "[[\\"FROM user\\"]]": Object {
              "a": "a1",
              "c": Object {
                "[[\\"FROM thingos\\"]]": Object {
                  "a": "a4",
                  "c": Object {
                    "[[\\"derp\\"]]": Object {
                      "a": "a6",
                      "t": 0,
                    },
                    "[[\\"foo\\"]]": Object {
                      "a": "a5",
                      "t": 0,
                      "used": true,
                    },
                  },
                  "t": 1,
                  "used": true,
                },
                "[[\\"lastName\\"]]": Object {
                  "a": "a3",
                  "t": 0,
                },
                "[[\\"name\\"]]": Object {
                  "a": "a2",
                  "t": 0,
                  "used": true,
                },
              },
              "t": 2,
              "used": true,
            },
          },
          "count": 6,
          "t": 1,
        }
    `)
    filterTape(query.tape)
    expect(query.tape).toMatchInlineSnapshot(`
        Object {
          "a": "data",
          "c": Object {
            "[[\\"FROM user\\"]]": Object {
              "a": "a1",
              "c": Object {
                "[[\\"FROM thingos\\"]]": Object {
                  "a": "a4",
                  "c": Object {
                    "[[\\"foo\\"]]": Object {
                      "a": "a5",
                      "t": 0,
                    },
                  },
                  "t": 1,
                },
                "[[\\"name\\"]]": Object {
                  "a": "a2",
                  "t": 0,
                },
              },
              "t": 2,
            },
          },
          "t": 1,
        }
    `)
})

test('filter null tape', () => {
    expect(() => filterData({ a: 'data', t: 1 }, {})).not.toThrow()
    expect(() => mergeData({ a: 'data', t: 1 }, {}, {})).not.toThrow()
    expect(() => filterTape({ a: 'data', t: 1 })).not.toThrow()
    expect(() => cleanTape({ a: 'data', t: 1 })).not.toThrow()
})
