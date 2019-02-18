const User = require('../models/user')

const mongoose = require('mongoose')
const supertest = require('supertest')
const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

describe('when there is initially one user in database', async () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const user = new User({ username: 'root', password: 'salakala' })
    await user.save()
  })

  test('creation succeeds with a unique username', async () => {
    const usersAtStart = await helper.usersInDatabase()

    const newUser = {
      username: 'ttestaaja',
      name: 'Tauno Testaaja',
      password: 'salasana'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDatabase()
    expect(usersAtEnd.length).toBe(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((user) => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails properly when username already taken', async () => {
    const usersAtStart = await helper.usersInDatabase()

    const newUser = {
      username: 'root',
      name: 'Juurakko',
      password: 'salasana'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` to be unique')

    const usersAtEnd = await helper.usersInDatabase()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails properly when username is too short', async () => {
    const usersAtStart = await helper.usersInDatabase()

    const newUser = {
      username: 'x',
      name: 'Liian Lyhyt',
      password: 'salasana'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain(
      '`username` (`x`) is shorter than the minimum allowed length (3).'
    )

    const usersAtEnd = await helper.usersInDatabase()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })

  test('creation fails properly when password is too short', async () => {
    const usersAtStart = await helper.usersInDatabase()

    const newUser = {
      username: 'ppesusie',
      name: 'Paavo Pesusieni',
      password: 'x'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain(
      'password has to be at least 3 characters long'
    )

    const usersAtEnd = await helper.usersInDatabase()
    expect(usersAtEnd.length).toBe(usersAtStart.length)
  })
})

afterAll(() => {
  mongoose.connection.close()
})
