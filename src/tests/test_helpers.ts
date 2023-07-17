import Anime from '../models/anime'
import User from '../models/user'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../utils/config'

export const usersInDB = async () => {
  const users = await User.find({})

  return users.map((u) => u.toJSON())
}

export const animeInDB = async () => {
  const anime = await Anime.find({})

  return anime.map((u) => u.toJSON())
}

export const initialAnime = [
  {
    name: 'AlreadyExists',
    airDate: '10.03.2021',
    numOfEpisodes: 12,
  },
  {
    name: 'AnotherAnime',
    airDate: '10.03.2021',
    numOfEpisodes: 24,
    owner: null,
  },
]

export const databaseSetup = async (): Promise<void> => {
  await Anime.deleteMany({})
  await User.deleteMany({})

  await Anime.insertMany(initialAnime)
  await User.insertMany([
    {
      username: 'root',
      passwordHash: await bcrypt.hash('secret', 10),
      jwt: null,
      animeList: { AnotherAnime: { progress: 0 } },
    },
  ])

  const user = await User.findOne({ username: 'root' })
  const anime = await Anime.findOne({ name: 'AnotherAnime' })

  const userForToken = {
    username: user?.username,
    id: user?._id,
  }

  if (user && anime) {
    user.jwt = jwt.sign(userForToken, config.database.SECRET, {
      expiresIn: 60 * 60,
    })
    anime.owner = user?._id.toString()

    await anime.save()
    await user.save()
  }
}
