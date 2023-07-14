import bcrypt from 'bcrypt'
import supertest from 'supertest'
import app from '../app'
import User from '../models/user'

import { usersInDB } from './test_helpers'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { config } from '../utils/config'

const api = supertest(app)

describe('user registration', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({ username: 'root', passwordHash })
    await user.save()
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

    const result = await api
      .post('/register')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await usersInDB()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails without username', async () => {
    const usersAtStart = await usersInDB()

    const newUser = {
      name: '',
      password: 'password',
    }

    const result = await api
      .post('/register')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('`username` is required')

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

    const result = await api
      .post('/register')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain(
      'User validation failed: username: Path'
    )

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

describe('user login', () => {
  test('logging in with correct credentials succeeds', async () => {
    const newUser = {
      username: 'root',
      password: 'secret',
    }

    const result = await api
      .post('/login')
      .send(newUser)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    console.log(result)

    expect(result.body.token).toBeDefined()
  })

  test('logging in with invalid credentials fails', async () => {
    const newUser = {
      username: 'root',
      password: 'notsecret',
    }

    const result = await api
      .post('/login')
      .send(newUser)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    console.log(result)

    expect(result.body.token).toBeUndefined()
  })

  test('logging in without username fails', async () => {
    const newUser = {
      password: 'secret',
    }

    const result = await api
      .post('/login')
      .send(newUser)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    console.log(result)

    expect(result.body.error).toContain('invalid username or password')
    expect(result.body.token).toBeUndefined()
  })

  test('logging in without password fails', async () => {
    const newUser = {
      username: 'root',
    }

    const result = await api
      .post('/login')
      .send(newUser)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('invalid username or password')
    expect(result.body.token).toBeUndefined()
  })
})

interface JwyPayload {
  username: string
  id: string
  iat: number
  exp: number
}

test('logged user has valid jwt token in document', async () => {
  const user = await User.findOne({ username: 'root' })
  if (user && user.jwt) {
    const decodedToken = jwt.verify(
      user.jwt,
      config.database['SECRET']
    ) as JwyPayload
    expect(decodedToken.exp).toBeGreaterThanOrEqual(Date.now() / 1000)
  }
})

afterAll(async () => {
  await mongoose.connection.close()
})
