/* eslint-disable @typescript-eslint/no-explicit-any */
import { escapeSQLite, sqliteCodegen } from '../lib/codegen'
import { createQuery, printWeave } from '../lib/query'

test('sqlite codegen', () => {
    const query = createQuery()
    query`CURRENT_TIMESTAMP`
    query.many`FROM user`.map(user => {
        user`name`
        user`EXISTS(SELECT 1 FROM user_follow WHERE user = user.id AND follower = ${42})`
        user.many`FROM project WHERE author = user.id`.map(project => {
            project`name`
        })
    })
    query.one`FROM bozo`
    expect(() =>
        sqliteCodegen({
            t: 4,
            a: 'x',
            c: {
                '["x"]': {
                    t: 0,
                    miss: true,
                    a: 'y',
                },
            },
        })
    ).toThrow()
    expect(printWeave(sqliteCodegen(query.tape), escapeSQLite)).toMatchInlineSnapshot(`
        "SELECT json_object(
          'a1', (SELECT CURRENT_TIMESTAMP),
          'a2', (SELECT json_group_array(json(a2)) FROM (SELECT json_object(
            'a3', (SELECT name),
            'a4', (SELECT EXISTS(SELECT 1 FROM user_follow WHERE user = user.id AND follower = '42')),
            'a5', (SELECT json_group_array(json(a5)) FROM (SELECT json_object(
              'a6', (SELECT name)
            ) AS a5 FROM project WHERE author = user.id))
          ) AS a2 FROM user))
        ) AS data "
    `)
    expect(printWeave(sqliteCodegen(query.tape, false), escapeSQLite)).toMatchInlineSnapshot(
        `"SELECT json_object('a1', (SELECT CURRENT_TIMESTAMP),'a2', (SELECT json_group_array(json(a2)) FROM (SELECT json_object('a3', (SELECT name),'a4', (SELECT EXISTS(SELECT 1 FROM user_follow WHERE user = user.id AND follower = '42')),'a5', (SELECT json_group_array(json(a5)) FROM (SELECT json_object('a6', (SELECT name)) AS a5 FROM project WHERE author = user.id))) AS a2 FROM user))) AS data "`
    )
})

test('sqlite escape', () => {
    expect(escapeSQLite(null)).toBe('NULL')
    expect(escapeSQLite(42)).toBe("'42'")
    expect(escapeSQLite([1, 2, 3] as any)).toBe("('1','2','3')")
    expect(escapeSQLite('hello')).toBe("'hello'")
})
