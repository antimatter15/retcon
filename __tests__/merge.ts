import { createQuery, mergeData } from '../lib/query'

test('merge', () => {
    const tape = { a: 'data', t: 1, count: 0 }
    const data = {}
    const query = createQuery(tape, data, true)

    query`CURRENT_TIMESTAMP`
    const user = query.one`FROM user WHERE id = ${1}`

    user.many`FROM project WHERE author = user.id`.map(project => {
        project`name`
        project`summary`
    })

    mergeData(query.tape, data, {
        a1: '420',
        a2: {
            a3: [
                { a4: 'proj1 name', a5: 'proj1 summary' },
                { a4: 'proj2 name', a5: 'proj2 summary' },
            ],
        },
    })

    expect(query`CURRENT_TIMESTAMP`).toBe('420')
    const user1 = query.one`FROM user WHERE id = ${1}`
    const projects = user1.many`FROM project WHERE author = user.id`
    expect(projects.length).toBe(2)
    expect(projects[0]`name`).toBe('proj1 name')

    expect(projects[0]`derp`).toBe(undefined)

    mergeData(query.tape, data, {
        a2: {
            a3: [{ a6: 'wumbo' }, { a6: 'blarpo' }],
        },
    })

    expect(projects[0]`derp`).toBe('wumbo')
})
