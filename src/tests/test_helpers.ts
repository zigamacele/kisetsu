import Anime from '../models/anime'
import User from '../models/user'
import bcrypt from 'bcrypt'

export const usersInDB = async () => {
  const users = await User.find({})

  return users.map((u) => u.toJSON())
}

export const animeInDB = async () => {
  const anime = await Anime.find({})

  return anime.map((u) => u.toJSON())
}

export const initialUsers = async () => {
  return [
    {
      username: 'root',

      passwordHash: await bcrypt.hash('secret', 10),
      jwt: null,
      animeList: { AnotherAnime: { progress: 0 } },
    },
  ]
}

export const initialAnime = [
  {
    name: 'AlreadyExists',
    airDate: '10.03.2021',
  },
  {
    name: 'AnotherAnime',
    airDate: '10.03.2021',
    owner: null,
  },
]

export const databaseSetup = async (): Promise<void> => {
  // await Anime.deleteMany({})
  // await User.deleteMany({})
  //
  // await Anime.insertMany(initialAnime)
  // await User.insertMany([
  //   {
  //     username: 'root',
  //     passwordHash: await bcrypt.hash('secret', 10),
  //     jwt: null,
  //     animeList: { AnotherAnime: { progress: 0 } },
  //   },
  // ])
  //
  // const user = await User.findOne({ username: 'root' })
  // const anime = await Anime.findOne({ name: 'AnotherAnime' })
  //
  // if (user && anime) {
  //   anime.owner = user?._id.toString()
  //   await anime.save()
  // }

  await User.deleteMany({})
  await Anime.deleteMany({})

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
}
