import User from '../models/user'

type UserType = { u: string }

export const usersInDB = async () => {
  const users = await User.find({})

  return users.map<Document>((u) => u.toJSON())
}
