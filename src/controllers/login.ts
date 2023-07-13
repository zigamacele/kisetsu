import bcrypt from 'bcrypt'
import { Request, Response, Router } from 'express'
import User from '../models/user'
import jwt from 'jsonwebtoken'
import { config } from '../utils/config'

export const loginRouter = Router()

loginRouter.post('/', async (req: Request, res: Response) => {
  const { username, password } = req.body
  if (!password) {
    res.status(401).json({ error: 'invalid username or password' })
  }
  const user = await User.findOne({ username })
  const isPasswordCorrect =
    user === null ? false : await bcrypt.compare(password, user?.passwordHash)

  if (!(user && isPasswordCorrect)) {
    return res.status(401).json({
      error: 'invalid username or password',
    })
  }

  const userForToken = {
    username: user.username,
    id: user._id,
  }

  const token = jwt.sign(userForToken, config.database.SECRET, {
    expiresIn: 60 * 60,
  })

  return res
    .status(200)
    .send({ token, username: user?.username, name: user?.name })
})
