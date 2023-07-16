import User from '../models/user'
import Anime from '../models/anime'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../utils/config'
import supertest from 'supertest'
import app from '../app'

const api = supertest(app)

describe('user endpoint', () => {
  beforeAll(async () => {
    await Anime.deleteMany({})
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({
      username: 'root',
      passwordHash,
      animeList: { AnotherAnime: { progress: 0 }, Test: { progress: 0 } },
    })
    await user.save()

    const userRoot = await User.findOne({ username: 'root' })
    const anotherAnime = new Anime({
      name: 'AnotherAnime',
      airDate: '10.03.2021',
      owner: userRoot?._id,
    })

    await anotherAnime.save()

    const anime = new Anime({
      name: 'Test',
      airDate: '10.03.2021',
      owner: userRoot?._id,
    })
    await anime.save()

    const userToken = await User.findOne({ username: 'root' })

    const userForToken = {
      username: userToken?.username,
      id: userToken?._id,
    }

    if (userToken) {
      userToken.jwt = jwt.sign(userForToken, config.database.SECRET, {
        expiresIn: 60 * 60,
      })

      await userToken.save()
    }
  })

  describe('getting users list', () => {
    test('succeeds with valid authorization header', async () => {
      const user = await User.findOne({ username: 'root' })

      const result = await api
        .get('/user/list')
        .set('Authorization', user?.jwt as string)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      expect(result.body).toEqual(user?.animeList)
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
        .get('/user/list/' + 'Test')
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
        .get('/user/list/' + 'Test')
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
        .put('/user/list/' + 'Test')
        .set('Authorization', user?.jwt as string)
        .send(body)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const userAfter = await User.findOne({ username: 'root' })

      userAfter?.animeList['Test'] &&
        expect(userAfter.animeList['Test'].progress).toBe(5)
    })

    test('fails without sending body', async () => {
      const user = await User.findOne({ username: 'root' })

      await api
        .put('/user/list/' + 'Test')
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

    const anime = await Anime.findOne({ name: 'Test' })

    const result = await api
      .delete('/anime/delete/' + anime?._id.toString())
      .set('Authorization', user?.jwt as string)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    const animeAfter = await Anime.findOne({ name: 'Test' })
    const userAfter = await User.findOne({ username: 'root' })

    expect(animeAfter).toBe(null)

    expect(userAfter?.animeList).not.toHaveProperty('Test')

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

  test('deleting anoter users anime fails', async () => {
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

describe('authorization middleware', () => {
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
      name: 'Test2',
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
