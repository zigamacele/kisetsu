import Anime from '../models/anime'
import User from '../models/user'

export const usersInDB = async () => {
  const users = await User.find({})

  return users.map((u) => u.toJSON())
}

export const animeInDB = async () => {
  const anime = await Anime.find({})

  return anime.map((u) => u.toJSON())
}
