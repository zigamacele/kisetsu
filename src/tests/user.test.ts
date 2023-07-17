import User from '../models/user'
import Anime from '../models/anime'
import mongoose from 'mongoose'
import supertest from 'supertest'
import app from '../app'
import { databaseSetup } from './test_helpers'

const api = supertest(app)

describe('user endpoint', () => {
  beforeAll(async () => {
    await databaseSetup()
  })

  describe('getting users list', () => {
    test('succeeds with valid authorization header', async () => {
      const user = await User.findOne({ username: 'root' })

      await api
        .get('/user/list')
        .set('Authorization', user?.jwt as string)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('fails without valid authorization header', async () => {
      const invalidToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJvb3QiLCJpZCI6IjY0YjI2NGMwMjFiOGZlOThmNWNiNTNhMCIsImlhdCI6MTY4OTQxMjgwMCwiZXhwIjoxNjg5NDEyODAxfQ.1k6-AN4F0WbZ2vX8lxIL6ezF05vaO-8himgrv92WscQ'

      await api
        .get('/user/list')
        .set('Authorization', invalidToken)
        .expect(403)
        .expect('Content-Type', /application\/json/)
    })
  })

  describe('getting specific anime from users list', () => {
    test('succeeds with valid authorization header & id', async () => {
      const user = await User.findOne({ username: 'root' })

      await api
        .get('/user/list/' + 'AnotherAnime')
        .set('Authorization', user?.jwt as string)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('fails with id that doesnt exist', async () => {
      const user = await User.findOne({ username: 'root' })

      await api
        .get('/user/list/' + 'DoesntExist')
        .set('Authorization', user?.jwt as string)
        .expect(404)
        .expect('Content-Type', /application\/json/)
    })

    test('fails if provided authorization header doesnt belong to any user', async () => {
      const invalidToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJvb3QiLCJpZCI6IjY0YjI2NGMwMjFiOGZlOThmNWNiNTNhMCIsImlhdCI6MTY4OTQxMjgwMCwiZXhwIjoxNjg5NDEyODAxfQ.1k6-AN4F0WbZ2vX8lxIL6ezF05vaO-8himgrv92WscQ'

      await api
        .get('/user/list/' + 'AnotherAnime')
        .set('Authorization', invalidToken)
        .expect(403)
        .expect('Content-Type', /application\/json/)
    })
  })

  describe('updating specific anime from users list', () => {
    test('succeeds with valid authorization header & id & body', async () => {
      const user = await User.findOne({ username: 'root' })

      const body = {
        progress: 5,
      }
      await api
        .put('/user/list/' + 'AnotherAnime')
        .set('Authorization', user?.jwt as string)
        .send(body)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const userAfter = await User.findOne({ username: 'root' })

      userAfter?.animeList['AnotherAnime'] &&
        expect(userAfter.animeList['AnotherAnime']['progress']).toBe(5)
    })

    test('fails without sending body', async () => {
      const user = await User.findOne({ username: 'root' })

      await api
        .put('/user/list/' + 'AnotherAnime')
        .set('Authorization', user?.jwt as string)
        .expect(400)
        .expect('Content-Type', /application\/json/)
    })

    test('fails with non-existent id', async () => {
      const user = await User.findOne({ username: 'root' })

      await api
        .put('/user/list/' + 'DoesntExist')
        .set('Authorization', user?.jwt as string)
        .expect(400)
        .expect('Content-Type', /application\/json/)
    })
  })

  describe('deleting specific anime from users list', () => {
    test('succeeds with valid authorization header & id', async () => {
      const user = await User.findOne({ username: 'root' })

      expect(user?.animeList).toHaveProperty('AnotherAnime')

      await api
        .delete('/user/list/' + 'AnotherAnime')
        .set('Authorization', user?.jwt as string)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const userAfter = await User.findOne({ username: 'root' })
      expect(userAfter?.animeList).not.toHaveProperty('AnotherAnime')
    })

    test('fails with non-existent id', async () => {
      const user = await User.findOne({ username: 'root' })

      await api
        .delete('/user/list/' + 'DoesntExist')
        .set('Authorization', user?.jwt as string)
        .expect(400)
        .expect('Content-Type', /application\/json/)
    })
  })
})

describe('delete existing anime', () => {
  test('deleting users anime succeeds', async () => {
    const user = await User.findOne({ username: 'root' })

    const anime = await Anime.findOne({ name: 'AnotherAnime' })

    const result = await api
      .delete('/anime/delete/' + anime?._id.toString())
      .set('Authorization', user?.jwt as string)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const animeAfter = await Anime.findOne({ name: 'AnotherAnime' })
    const userAfter = await User.findOne({ username: 'root' })

    expect(animeAfter).toBe(null)

    expect(userAfter?.animeList).not.toHaveProperty('AnotherAnime')

    expect(result.body.info).toContain('was deleted')
  })

  test('updating users anime fails with wrong id', async () => {
    const user = await User.findOne({ username: 'root' })

    const wrongId = '64b2b3aec6d9680ffff23cbd'

    const result = await api
      .delete('/anime/delete/' + wrongId)
      .set('Authorization', user?.jwt as string)
      .expect(404)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('Not found')
  })

  test('deleting another users anime fails', async () => {
    const user = await User.findOne({ username: 'root' })
    const anime = await Anime.findOne({ name: 'AlreadyExists' })

    const result = await api
      .delete('/anime/delete/' + anime?._id.toString())
      .set('Authorization', user?.jwt as string)
      .expect(403)
      .expect('Content-Type', /application\/json/)

    const animeAfter = await Anime.findOne({ name: 'AlreadyExists' })

    expect(!!animeAfter).toBe(true)

    expect(result.body.error).toContain('Insufficient permissions')
  })
})

describe('getting schedule for users anime', () => {
  test('succeeds with valid authorization header', async () => {
    const user = await User.findOne({ username: 'root' })

    await api
      .get('/user/schedule')
      .set('Authorization', user?.jwt as string)
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })
})

test('fails without valid authorization header', async () => {
  const invalidToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InJvb3QiLCJpZCI6IjY0YjI2NGMwMjFiOGZlOThmNWNiNTNhMCIsImlhdCI6MTY4OTQxMjgwMCwiZXhwIjoxNjg5NDEyODAxfQ.1k6-AN4F0WbZ2vX8lxIL6ezF05vaO-8himgrv92WscQ'

  await api
    .get('/user/schedule')
    .set('Authorization', invalidToken)
    .expect(403)
    .expect('Content-Type', /application\/json/)
})

afterAll(async () => {
  await mongoose.connection.close()
})
