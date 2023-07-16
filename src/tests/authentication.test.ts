import User from '../models/user'
import mongoose from 'mongoose'
import supertest from 'supertest'
import app from '../app'
import { databaseSetup } from './test_helpers'

const api = supertest(app)

describe('authorization middleware', () => {
  beforeAll(async () => {
    await databaseSetup()
  })
  test('request to /login succeeds without authorization header', async () => {
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

  test('request to /anime/create succeeds with valid authorization header', async () => {
    const body = {
      name: 'Test',
      airDate: '10.03.2021',
      numOfEpisodes: 24,
    }

    const user = await User.findOne({ username: 'root' })

    await api
      .post('/anime/create')
      .set('Authorization', user?.jwt as string)
      .send(body)
      .expect(201)
      .expect('Content-Type', /application\/json/)
  })

  test('request to /anime/create fails with token not belonging to any user', async () => {
    const body = {
      name: 'Test',
      airDate: '10.03.2021',
      numOfEpisodes: 24,
    }

    const invalidToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJvb3QiLCJpZCI6IjY0YjI2NGMwMjFiOGZlOThmNWNiNTNhMCIsImlhdCI6MTY4OTQxMjgwMCwiZXhwIjoxNjg5NDEyODAxfQ.1k6-AN4F0WbZ2vX8lxIL6ezF05vaO-8himgrv92WscQ'

    const result = await api
      .post('/anime/create')
      .set('Authorization', invalidToken)
      .send(body)
      .expect(403)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Insufficient permissions')
  })

  test('request to /anime/create fails with expired token', async () => {
    const user = await User.findOne({ username: 'root' })

    const body = {
      name: 'Test',
      airDate: '10.03.2021',
      numOfEpisodes: 24,
    }

    const expiredToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJvb3QiLCJpZCI6IjY0YjI2NGMwMjFiOGZlOThmNWNiNTNhMCIsImlhdCI6MTY4OTQxMjgwMCwiZXhwIjoxNjg5NDEyODAxfQ.1k6-AN4F0WbZ2vX8lxIL6ezF05vaO-8himgrv92WscQ'

    if (user) {
      user.jwt = expiredToken
      await user?.save()
    }

    const result = await api
      .post('/anime/create')
      .set('Authorization', expiredToken)
      .send(body)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Auth failed')
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
