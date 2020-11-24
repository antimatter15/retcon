import { createQuery, dangerouslyUseRawSQL, SQL } from '../lib/query'

function fakeTemplate(x) {
    x.raw = [1, 2, 3]
    return x
}

test('fragments', () => {
    expect(() => SQL('hello' as any)).toThrow()
    expect(() => SQL(['hello'] as any)).toThrow()
    expect(() => SQL(['hello', 'world'] as any)).toThrow()
    expect(() => SQL(['hello', 'world'] as any, 'merp')).toThrow()

    expect(() => SQL(fakeTemplate(['hello']))).not.toThrow()
    expect(() => SQL(fakeTemplate(['hello', 'world']), 'merp')).not.toThrow()
    expect(() => SQL(fakeTemplate(['hello', 'world']))).toThrow()
    expect(() => SQL(fakeTemplate(['hello']), 'world')).toThrow()

    expect(SQL`user.name`).toMatchInlineSnapshot(`
        Object {
          "__sqlFragment": Array [
            Array [
              "user.name",
            ],
          ],
        }
    `)

    const name = SQL`user.name`

    expect(SQL`FROM user WHERE ${name} = ${42}`).toMatchInlineSnapshot(`
        Object {
          "__sqlFragment": Array [
            Array [
              "FROM user WHERE user.name = ",
              "",
            ],
            42,
          ],
        }
    `)
})

test('dangerous', () => {
    expect(
        dangerouslyUseRawSQL({
            __sql: 'test',
        })
    ).toMatchInlineSnapshot(`
        Object {
          "__sqlFragment": Array [
            Array [
              "test",
            ],
          ],
        }
    `)

    const danger = dangerouslyUseRawSQL({
        __sql: 'test',
    })

    expect(SQL`FROM ${danger}`).toMatchInlineSnapshot(`
        Object {
          "__sqlFragment": Array [
            Array [
              "FROM test",
            ],
          ],
        }
    `)
})

test('fragment as only argument', () => {
    const query = createQuery()
    const UserId = SQL`user.id`

    query(UserId)
    expect(Object.keys(query.tape.c!)).toMatchInlineSnapshot(`
        Array [
          "[[\\"user.id\\"]]",
        ]
    `)
})

test('fragment as only argument', () => {
    const query = createQuery()
    const UserId = SQL`user.id`

    expect(() => query({} as any)).toThrow()
})

test('invalid tape', () => {
    const query = createQuery(null as any)
    expect(() => query`CURRENT_TIMESTAMP`).toThrow()
})

test('multiple fragments', () => {
    const query = createQuery()
    const UserId = SQL`user.id`

    expect(() => (query as any)(UserId, UserId)).toThrow()
})
