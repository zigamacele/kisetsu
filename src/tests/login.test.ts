import User from '../models/user'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { config } from '../utils/config'
import dayjs from 'dayjs'
import mongoose from 'mongoose'
import supertest from 'supertest'
import app from '../app'
import { databaseSetup } from './test_helpers'

const api = supertest(app)

describe('user login', () => {
  beforeAll(async () => {
    await databaseSetup()
  })

  test('logging in with correct credentials succeeds', async () => {
    const user = {
      username: 'root',
      password: 'secret',
    }

    const result = await api
      .post('/login')
      .send(user)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    expect(result.body.token).toBeDefined()
  })

  test('logging in with invalid credentials fails', async () => {
    const user = {
      username: 'root',
      password: 'notsecret',
    }

    const result = await api
      .post('/login')
      .send(user)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(result.body.token).toBeUndefined()
  })

  test('logging in without username fails', async () => {
    const user = {
      password: 'secret',
    }

    const result = await api
      .post('/login')
      .send(user)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Auth failed')
    expect(result.body.token).toBeUndefined()
  })

  test('logging in without password fails', async () => {
    const user = {
      username: 'root',
    }

    const result = await api
      .post('/login')
      .send(user)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Auth failed')
    expect(result.body.token).toBeUndefined()
  })

  test('logged user has valid jwt token in document', async () => {
    const user = await User.findOne({ username: 'root' })
    if (user && user.jwt) {
      const decodedToken = jwt.verify(
        user.jwt,
        config.database['SECRET']
      ) as JwtPayload
      expect(decodedToken.exp).toBeGreaterThanOrEqual(dayjs().unix())
    }
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
