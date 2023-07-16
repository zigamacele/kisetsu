import { databaseSetup, usersInDB } from './test_helpers'
import supertest from 'supertest'
import app from '../app'
import mongoose from 'mongoose'

const api = supertest(app)

describe('user registration', () => {
  beforeEach(async () => {
    await databaseSetup()
  })

  test('creation succeeds with fresh username', async () => {
    const usersAtStart = await usersInDB()
    const newUser = {
      username: 'Ziga',
      name: 'Ziga',
      password: 'password',
    }

    await api
      .post('/register')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map((u) => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with existing username', async () => {
    const usersAtStart = await usersInDB()

    const newUser = {
      username: 'root',
      name: '',
      password: 'password',
    }

    await api
      .post('/register')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails without username', async () => {
    const usersAtStart = await usersInDB()

    const newUser = {
      name: '',
      password: 'password',
    }

    await api
      .post('/register')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails if username is less then 3 characters long', async () => {
    const usersAtStart = await usersInDB()

    const newUser = {
      username: 'Zi',
      name: '',
      password: 'password',
    }

    await api
      .post('/register')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails without password', async () => {
    const usersAtStart = await usersInDB()

    const newUser = {
      username: 'Ziga',
      name: '',
    }

    const result = await api
      .post('/register')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Password is required')

    const usersAtEnd = await usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails if password is less then 8 characters long', async () => {
    const usersAtStart = await usersInDB()

    const newUser = {
      username: 'Ziga',
      name: '',
      password: 'pass',
    }

    const result = await api
      .post('/register')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain(
      'Password must be at least 8 characters long'
    )

    const usersAtEnd = await usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
