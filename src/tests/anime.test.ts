import { animeInDB } from './test_helpers'
import User from '../models/user'
import Anime from '../models/anime'
import supertest from 'supertest'
import app from '../app'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../utils/config'
import mongoose from 'mongoose'

const api = supertest(app)

describe('anime endpoint', () => {
  describe('anime creation', () => {
    beforeAll(async () => {
      await Anime.deleteMany({})
      await User.deleteMany({})

      const passwordHash = await bcrypt.hash('secret', 10)
      const user = new User({
        username: 'root',
        passwordHash,
        animeList: { AnotherAnime: { progress: 0 } },
      })
      await user.save()

      const anime = new Anime({
        name: 'AlreadyExists',
        airDate: '10.03.2021',
      })
      await anime.save()

      const userRoot = await User.findOne({ username: 'root' })
      const anotherAnime = new Anime({
        name: 'AnotherAnime',
        airDate: '10.03.2021',
        owner: userRoot?._id,
      })
      await anotherAnime.save()

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

    test('creation of anime already in database, adds already existing anime to user document', async () => {
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
        .expect(200)
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

  describe('update existing anime', () => {
    test('updating users anime succeeds', async () => {
      const body = {
        airDate:
          'Sat Sep 13 275760 00:00:00 GMT+0000 (Coordinated Universal Time)',
        numOfEpisodes: 12,
      }

      const user = await User.findOne({ username: 'root' })

      const anime = await Anime.findOne({ name: 'Test' })

      const result = await api
        .put('/anime/update/' + anime?._id.toString())
        .set('Authorization', user?.jwt as string)
        .send(body)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const animeAfter = await Anime.findOne({ name: 'Test' })

      expect(animeAfter?.numOfEpisodes).toBe(12)

      expect(result.body.info).toContain('was updated')
    })

    test('updating users anime fails without body', async () => {
      const body = {}

      const user = await User.findOne({ username: 'root' })

      const anime = await Anime.findOne({ name: 'Test' })

      const result = await api
        .put('/anime/update/' + anime?._id.toString())
        .set('Authorization', user?.jwt as string)
        .send(body)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      const animeAfter = await Anime.findOne({ name: 'Test' })

      expect(animeAfter?.numOfEpisodes).toBe(anime?.numOfEpisodes)

      expect(result.body.error).toContain('Bad request')
    })

    test('updating users anime fails with wrong id', async () => {
      const body = {
        airDate:
          'Sat Sep 13 275760 00:00:00 GMT+0000 (Coordinated Universal Time)',
        numOfEpisodes: 12,
      }

      const user = await User.findOne({ username: 'root' })

      const wrongId = '64b2b3aec6d9680ffff23cbd'

      const result = await api
        .put('/anime/update/' + wrongId)
        .set('Authorization', user?.jwt as string)
        .send(body)
        .expect(404)
        .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('Not found')
    })

    test('updating another users anime fails', async () => {
      const body = {
        airDate:
          'Sat Sep 13 275760 00:00:00 GMT+0000 (Coordinated Universal Time)',
        numOfEpisodes: 12,
      }

      const user = await User.findOne({ username: 'root' })
      const anime = await Anime.findOne({ name: 'AlreadyExists' })

      const result = await api
        .put('/anime/update/' + anime?._id.toString())
        .set('Authorization', user?.jwt as string)
        .send(body)
        .expect(403)
        .expect('Content-Type', /application\/json/)

      const animeAfter = await Anime.findOne({ name: 'AlreadyExists' })

      expect(animeAfter?.numOfEpisodes).toBe(anime?.numOfEpisodes)

      expect(result.body.error).toContain('Insufficient permissions')
    })
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
