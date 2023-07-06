import User from '../models/user'

export const usersInDB = async () => {
  const users = await User.find({})

  return users.map((u) => u.toJSON())
}
