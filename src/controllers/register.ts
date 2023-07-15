import bcrypt from 'bcrypt'
import { NextFunction, Request, Response, Router } from 'express'
import User from '../models/user'
import {
  CustomErrorResponse,
  MissingErrorResponse,
  SuccessfulyCreatedResponse,
} from '../utils/responseTypes'

export const registerRouter = Router()

registerRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, name, password } = req.body

      if (!password) {
        MissingErrorResponse(res, 'Password')
      }
      if (password.length < 8)
        CustomErrorResponse(res, {
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

      SuccessfulyCreatedResponse(res, savedUser)
    } catch (error) {
      console.error(error)

      next(error)
    }
  }
)
