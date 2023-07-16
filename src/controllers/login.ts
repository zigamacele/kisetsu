import bcrypt from 'bcrypt'
import { Request, Response, Router } from 'express'
import User from '../models/user'
import jwt from 'jsonwebtoken'
import { config } from '../utils/config'
import {
  AuthFailedErrorResponse,
  CustomSuccessfulResponse,
  UnknownErrorResponse,
} from '../utils/responseTypes'

export const loginRouter = Router()

loginRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body

    if (!password) {
      return AuthFailedErrorResponse(res)
    }
    const user = await User.findOne({ username })
    const isPasswordCorrect =
      user === null ? false : await bcrypt.compare(password, user?.passwordHash)

    if (!(user && isPasswordCorrect)) {
      return AuthFailedErrorResponse(res)
    }

    const userForToken = {
      username: user.username,
      id: user._id,
    }

    const token = jwt.sign(userForToken, config.database.SECRET, {
      expiresIn: 60 * 60,
    })

    user.jwt = token

    await user.save()

    return CustomSuccessfulResponse(res, {
      token,
      username: user?.username,
      name: user?.name,
    })
  } catch {
    return UnknownErrorResponse(res)
  }
})
