import bcrypt from 'bcrypt'
import supertest from 'supertest'
import app from '../app'
import User from '../models/user'

import { usersInDB } from './test_helpers'
import mongoose from 'mongoose'

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
      username: 'zigzag',
      name: 'Zika',
      password: '123',
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
})

afterAll(async () => {
  await mongoose.connection.close()
})
