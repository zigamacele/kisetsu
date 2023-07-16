import { NextFunction, Request, Response, Router } from 'express'
import User from '../models/user'
import {
  BadRequestErrorResponse,
  CustomSuccessfulResponse,
  NotFoundErrorResponse,
} from '../utils/responseTypes'

export const userRouter = Router()

userRouter.get(
  '/list',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { authorization } = req.headers
      const user = await User.findOne({ jwt: authorization })

      if (!user) {
        return NotFoundErrorResponse(res)
      }

      return CustomSuccessfulResponse(res, user?.animeList)
    } catch (error) {
      console.error(error)

      return next(error)
    }
  }
)

userRouter.get(
  '/list/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { authorization } = req.headers
      const user = await User.findOne({ jwt: authorization })

      if (!user) {
        return NotFoundErrorResponse(res)
      }

      if (!id) {
        return BadRequestErrorResponse(res)
      }

      return CustomSuccessfulResponse(res, id && user?.animeList[id])
    } catch (error) {
      console.error(error)

      return next(error)
    }
  }
)

userRouter.put(
  '/list/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { progress } = req.body
      const { authorization } = req.headers
      const user = await User.findOne({ jwt: authorization })

      if (user && id) {
        const updatedAnimeList = { ...user.animeList }
        updatedAnimeList[id] = { progress }
        user.animeList = updatedAnimeList

        await user.save()

        CustomSuccessfulResponse(res, id && user?.animeList[id])
      }

      return BadRequestErrorResponse(res)
    } catch (error) {
      console.error(error)

      return next(error)
    }
  }
)

userRouter.delete(
  '/list/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { authorization } = req.headers
      const user = await User.findOne({ jwt: authorization })

      if (user && id) {
        const updatedAnimeList = { ...user.animeList }
        delete updatedAnimeList[id]
        user.animeList = updatedAnimeList

        await user.save()

        return CustomSuccessfulResponse(res, {
          message: 'Deleted successfully.',
        })
      }

      return BadRequestErrorResponse(res)
    } catch (error) {
      console.error(error)

      return next(error)
    }
  }
)
