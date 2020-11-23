import { escapePostgres, postgresCodegen } from '../lib/codegen'
import { createQuery, printWeave } from '../lib/query'

test('postgres codegen', () => {
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
        postgresCodegen({
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
    expect(printWeave(postgresCodegen(query.tape), escapePostgres)).toMatchInlineSnapshot(`
        "SELECT row_to_json(data.*) AS data FROM (SELECT 
          (SELECT CURRENT_TIMESTAMP) AS a1,
          (SELECT json_agg(row_to_json(a2.*)) FROM (SELECT 
            (SELECT name) AS a3,
            (SELECT EXISTS(SELECT 1 FROM user_follow WHERE user = user.id AND follower = 42)) AS a4,
            (SELECT json_agg(row_to_json(a5.*)) FROM (SELECT 
              (SELECT name) AS a6
             FROM project WHERE author = user.id) AS a5) AS a5
           FROM user) AS a2) AS a2
         ) AS data"
    `)
    expect(printWeave(postgresCodegen(query.tape, false), escapePostgres)).toMatchInlineSnapshot(
        `"SELECT row_to_json(data.*) AS data FROM (SELECT (SELECT CURRENT_TIMESTAMP) AS a1,(SELECT json_agg(row_to_json(a2.*)) FROM (SELECT (SELECT name) AS a3,(SELECT EXISTS(SELECT 1 FROM user_follow WHERE user = user.id AND follower = 42)) AS a4,(SELECT json_agg(row_to_json(a5.*)) FROM (SELECT (SELECT name) AS a6 FROM project WHERE author = user.id) AS a5) AS a5 FROM user) AS a2) AS a2 ) AS data"`
    )
})

test('postgres escape', () => {
    expect(escapePostgres(null)).toBe('NULL')
    expect(escapePostgres(true)).toBe('TRUE')
    expect(escapePostgres(false)).toBe('FALSE')
    expect(escapePostgres(42)).toBe('42')
    expect(escapePostgres([1, 2, 3] as any)).toBe('(1, 2, 3)')
    expect(escapePostgres('hello')).toBe("'hello'")
    expect(escapePostgres('he\\\\o')).toBe("E'he\\\\\\\\o'")
    expect(() => escapePostgres({ x: 42 } as any)).toThrow()
})
