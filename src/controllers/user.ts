import { Request, Response, Router } from 'express'
import User from '../models/user'
import {
  BadRequestErrorResponse,
  CustomSuccessfulResponse,
  NotFoundErrorResponse,
  UnknownErrorResponse,
} from '../utils/responseTypes'
import { addAnimeInformationFromDB, AnimeList } from '../utils/moreInformation'

export const userRouter = Router()

userRouter.get('/list', async (req: Request, res: Response) => {
  try {
    const { authorization } = req.headers
    const user = await User.findOne({ jwt: authorization })

    if (!user) {
      return NotFoundErrorResponse(res)
    }

    return CustomSuccessfulResponse(
      res,
      await addAnimeInformationFromDB(user.animeList)
    )
  } catch {
    return UnknownErrorResponse(res)
  }
})

userRouter.get('/list/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { authorization } = req.headers
    const user = await User.findOne({ jwt: authorization })

    if (!user || (id && !user.animeList[id])) {
      return NotFoundErrorResponse(res)
    }

    if (!id) {
      return BadRequestErrorResponse(res)
    }

    return CustomSuccessfulResponse(
      res,
      await addAnimeInformationFromDB({ [id]: user.animeList[id] } as AnimeList)
    )
  } catch {
    return UnknownErrorResponse(res)
  }
})

userRouter.put('/list/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { progress } = req.body
    const { authorization } = req.headers
    const user = await User.findOne({ jwt: authorization })

    if (user && progress && id && user.animeList[id]) {
      const updatedAnimeList = { ...user.animeList }
      updatedAnimeList[id] = { progress }
      user.animeList = updatedAnimeList

      await user.save()

      CustomSuccessfulResponse(res, id && user?.animeList[id])
    }

    return BadRequestErrorResponse(res)
  } catch {
    return UnknownErrorResponse(res)
  }
})

userRouter.delete('/list/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { authorization } = req.headers
    const user = await User.findOne({ jwt: authorization })

    if (user && id && user.animeList[id]) {
      const updatedAnimeList = { ...user.animeList }
      delete updatedAnimeList[id]
      user.animeList = updatedAnimeList

      await user.save()

      return CustomSuccessfulResponse(res, {
        message: 'Deleted successfully.',
      })
    }

    return BadRequestErrorResponse(res)
  } catch {
    return UnknownErrorResponse(res)
  }
})
