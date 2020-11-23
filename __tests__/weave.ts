import { indentWeave, isWeaveEmpty, printWeave, weave, Weave } from '../lib/query'

test('weave basics', () => {
    expect(weave``).toEqual([['']])

    expect(() => weave([])).toThrow()
    expect(() => weave([''])).not.toThrow()
    expect(() => weave([''], 42 as any)).toThrow()

    expect(weave`SELECT`).toEqual([['SELECT']])
    expect(weave`SELECT ${[['', ''], 42]}`).toEqual([['SELECT ', ''], 42])
    expect(weave`SELECT ${[['', ''], 42]} XYZ`).toEqual([['SELECT ', ' XYZ'], 42])
})

test('weave empty', () => {
    expect(isWeaveEmpty(weave``)).toBe(true)
    expect(isWeaveEmpty(weave`hello`)).toBe(false)
    expect(isWeaveEmpty([['']])).toBe(true)
    expect(isWeaveEmpty([['test']])).toBe(false)
    expect(isWeaveEmpty([['', ''], ''])).toBe(false)
})

test('print weave', () => {
    const val = [['', ''], 42] as Weave
    expect(printWeave(weave`SELECT * FROM user WHERE id = ${val}`)).toMatchInlineSnapshot(
        `"SELECT * FROM user WHERE id = {42}"`
    )
})

test('indent weave', () => {
    const val = [['', ''], 42] as Weave
    expect(printWeave(indentWeave(weave`SELECT * FROM user WHERE id = ${val}`)))
        .toMatchInlineSnapshot(`
        "
          SELECT * FROM user WHERE id = {42}
        "
    `)
})
