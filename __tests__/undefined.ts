import { createQuery } from '../lib/query'

test('undefined 1', () => {
    const tape = { a: 'data', t: 1, count: 0 }
    const data = {}
    const query = createQuery(tape, data, true)

    expect(query`CURRENT_TIMESTAMP`).toBe(undefined)

    const user = query.one`FROM user WHERE id = ${2}`
    expect(user`name`).toBe(undefined)
})

test('undefined 2', () => {
    const tape = { a: 'data', t: 1, count: 0 }
    const query = createQuery(tape, undefined, true)

    expect(query`CURRENT_TIMESTAMP`).toBe(undefined)

    const user = query.one`FROM user WHERE id = ${2}`
    expect(user`name`).toBe(undefined)
})
