import bcrypt from 'bcrypt'
import { NextFunction, Request, Response, Router } from 'express'
import User from '../models/user'

export const registerRouter = Router()

registerRouter.post(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, name, password } = req.body

      if (!password) {
        res.status(400).json({ error: 'Password is required' })
      }
      if (password.length < 8)
        res
          .status(400)
          .json({ error: 'Password must be at least 8 characters long' })

      const saltRounds = 10
      const passwordHash = await bcrypt.hash(password, saltRounds)

      const user = new User({
        username,
        name,
        passwordHash,
      })

      const savedUser = await user.save()

      res.status(201).json(savedUser)
    } catch (error) {
      console.error(error)

      next(error)
    }
  }
)
