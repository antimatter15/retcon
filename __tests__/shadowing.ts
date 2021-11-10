/* eslint-disable @typescript-eslint/no-explicit-any */
import { escapeSQLite, sqliteCodegen } from '../lib/codegen'
import { escapePostgres, postgresCodegen } from '../lib/codegen'
import { createQuery, printWeave, Ref, SQL } from '../lib/query'

test('shadowing', () => {
    const query = createQuery()
    query.many`FROM triplestore ${Ref} WHERE value = ${'user'} AND attribute = ${'type'}`.map(
        user => {
            user.many`FROM triplestore WHERE entity = ${user}.entity AND attribute = ${'name'}`.map(
                name => {
                    name`value`
                }
            )
        }
    )

    expect(printWeave(postgresCodegen(query.tape), escapePostgres)).toMatchInlineSnapshot(`
        "SELECT row_to_json(data.*) AS data FROM (SELECT 
          (SELECT json_agg(row_to_json(a1.*)) FROM (SELECT 
            (SELECT json_agg(row_to_json(a2.*)) FROM (SELECT 
              (SELECT value) AS a3
             FROM triplestore WHERE entity = refa1.entity AND attribute = 'name') AS a2) AS a2
           FROM triplestore refa1 WHERE value = 'user' AND attribute = 'type') AS a1) AS a1
         ) AS data"
    `)

    expect(printWeave(sqliteCodegen(query.tape), escapeSQLite)).toMatchInlineSnapshot(`
        "SELECT json_object(
          'a1', (SELECT json_group_array(json(a1)) FROM (SELECT json_object(
            'a2', (SELECT json_group_array(json(a2)) FROM (SELECT json_object(
              'a3', (SELECT value)
            ) AS a2 FROM triplestore WHERE entity = refa1.entity AND attribute = 'name'))
          ) AS a1 FROM triplestore refa1 WHERE value = 'user' AND attribute = 'type'))
        ) AS data "
    `)
})

test('shadowing 2', () => {
    const query = createQuery()
    query.many`FROM triplestore ${Ref} WHERE value = ${'user'} AND attribute = ${'type'}`.map(
        user => {
            user.many`FROM triplestore ${Ref} WHERE entity = ${user}.entity AND attribute = ${'name'}`.map(
                name => {
                    name`${name}.value`
                }
            )
        }
    )

    expect(printWeave(postgresCodegen(query.tape), escapePostgres)).toMatchInlineSnapshot(`
        "SELECT row_to_json(data.*) AS data FROM (SELECT 
          (SELECT json_agg(row_to_json(a1.*)) FROM (SELECT 
            (SELECT json_agg(row_to_json(a2.*)) FROM (SELECT 
              (SELECT refa2.value) AS a3
             FROM triplestore refa2 WHERE entity = refa1.entity AND attribute = 'name') AS a2) AS a2
           FROM triplestore refa1 WHERE value = 'user' AND attribute = 'type') AS a1) AS a1
         ) AS data"
    `)

    expect(printWeave(sqliteCodegen(query.tape), escapeSQLite)).toMatchInlineSnapshot(`
        "SELECT json_object(
          'a1', (SELECT json_group_array(json(a1)) FROM (SELECT json_object(
            'a2', (SELECT json_group_array(json(a2)) FROM (SELECT json_object(
              'a3', (SELECT refa2.value)
            ) AS a2 FROM triplestore refa2 WHERE entity = refa1.entity AND attribute = 'name'))
          ) AS a1 FROM triplestore refa1 WHERE value = 'user' AND attribute = 'type'))
        ) AS data "
    `)
})

test('shadowing 3', () => {
    const query = createQuery()
    const EAV = (entity, attribute) =>
        SQL`FROM triplestore ${Ref} WHERE entity=${entity} AND attribute=${attribute}`
    const VAE = (value, attribute) =>
        SQL`FROM triplestore ${Ref} WHERE value=${value} AND attribute=${attribute}`

    query.many(VAE('user', 'type')).map(user => {
        user.many(EAV(SQL`${user}.entity`, 'name')).map(name => {
            name`${name}.value`
        })
    })

    expect(printWeave(postgresCodegen(query.tape), escapePostgres)).toMatchInlineSnapshot(`
        "SELECT row_to_json(data.*) AS data FROM (SELECT 
          (SELECT json_agg(row_to_json(a1.*)) FROM (SELECT 
            (SELECT json_agg(row_to_json(a2.*)) FROM (SELECT 
              (SELECT refa2.value) AS a3
             FROM triplestore refa2 WHERE entity=refa1.entity AND attribute='name') AS a2) AS a2
           FROM triplestore refa1 WHERE value='user' AND attribute='type') AS a1) AS a1
         ) AS data"
    `)

    expect(printWeave(sqliteCodegen(query.tape), escapeSQLite)).toMatchInlineSnapshot(`
        "SELECT json_object(
          'a1', (SELECT json_group_array(json(a1)) FROM (SELECT json_object(
            'a2', (SELECT json_group_array(json(a2)) FROM (SELECT json_object(
              'a3', (SELECT refa2.value)
            ) AS a2 FROM triplestore refa2 WHERE entity=refa1.entity AND attribute='name'))
          ) AS a1 FROM triplestore refa1 WHERE value='user' AND attribute='type'))
        ) AS data "
    `)
})
