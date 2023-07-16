import bcrypt from 'bcrypt'
import { Request, Response, Router } from 'express'
import User from '../models/user'
import {
  CustomErrorResponse,
  MissingErrorResponse,
  SuccessfullyCreatedResponse,
  UnknownErrorResponse,
} from '../utils/responseTypes'

export const registerRouter = Router()

registerRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { username, name, password } = req.body

    if (!password) {
      MissingErrorResponse(res, 'Password')
    }
    if (password.length < 8)
      return CustomErrorResponse(res, {
        error: 'Password must be at least 8 characters long',
      })

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = new User({
      username,
      name,
      passwordHash,
    })

    const savedUser = await user.save()

    return SuccessfullyCreatedResponse(res, savedUser)
  } catch {
    return UnknownErrorResponse(res)
  }
})
