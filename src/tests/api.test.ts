import bcrypt from 'bcrypt'
import supertest from 'supertest'
import app from '../app'
import User from '../models/user'

import { animeInDB, usersInDB } from './test_helpers'
import mongoose from 'mongoose'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { config } from '../utils/config'
import dayjs from 'dayjs'
import Anime from '../models/anime'

const api = supertest(app)

describe('user registration', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    await Anime.deleteMany({})

    const passwordHash = await bcrypt.hash('secret', 10)
    const user = new User({ username: 'root', passwordHash })
    await user.save()

    const anime = new Anime({
      name: 'AlreadyExists',
      airDate: '10.03.2021',
    })
    await anime.save()
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

    expect(result.body.error).toContain('invalid username or password')
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

    expect(result.body.error).toContain('invalid username or password')
    expect(result.body.token).toBeUndefined()
  })
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

describe('anime creation', () => {
  test('creation of new anime succeeds', async () => {
    const animeAtStart = await animeInDB()
    const body = {
      name: 'Test',
      airDate: '10.03.2021',
      numOfEpisodes: 24,
    }

    const userBefore = await User.findOne({ username: 'root' })

    await api
      .post('/anime/create')
      .set('Authorization', userBefore?.jwt as string)
      .send(body)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const userAfter = await User.findOne({ username: 'root' })

    const animeAtEnd = await animeInDB()

    expect(userAfter?.animeList).toHaveProperty('Test')

    expect(animeAtEnd).toHaveLength(animeAtStart.length + 1)
  })

  test('creation of anime already in database, adds alrady existing anime to user document', async () => {
    const animeAtStart = await animeInDB()
    const body = {
      name: 'AlreadyExists',
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

    const userAfter = await User.findOne({ username: 'root' })

    const animeAtEnd = await animeInDB()

    expect(userAfter?.animeList).toHaveProperty('AlreadyExists')

    expect(animeAtEnd).toHaveLength(animeAtStart.length)
  })

  test('creation of anime already in users document fails', async () => {
    const animeAtStart = await animeInDB()
    const body = {
      name: 'AlreadyExists',
      airDate: '10.03.2021',
      numOfEpisodes: 24,
    }

    const user = await User.findOne({ username: 'root' })

    const result = await api
      .post('/anime/create')
      .set('Authorization', user?.jwt as string)
      .send(body)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const animeAtEnd = await animeInDB()

    expect(user?.animeList).toHaveProperty('AlreadyExists')

    expect(result.body.error).toContain('anime is already in your list')

    expect(animeAtEnd).toHaveLength(animeAtStart.length)
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

    expect(result.body.error).toContain('Please login')
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

    expect(result.body.error).toContain('token expired')
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
