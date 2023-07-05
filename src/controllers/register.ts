import bcrypt from 'bcrypt'
import { Request, Response, Router } from 'express'
import User from '../models/user'

export const registerRouter = Router()

registerRouter.post('/', async (req: Request, res: Response) => {
  const { username, name, password } = req.body

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user: any = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()

  return res.status(201).json(savedUser)
})
