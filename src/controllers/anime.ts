import { NextFunction, Request, Response, Router } from 'express'
import Anime from '../models/anime'
import User from '../models/user'

export const animeRouter = Router()

animeRouter.post(
  '/create',
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, airDate, numOfEpisodes } = req.body
    const { authorization } = req.headers
    const user = await User.findOne({ jwt: authorization })

    try {
      const anime = new Anime({
        name,
        airDate,
        numOfEpisodes,
        owner: user?._id,
      })

      const savedAnime = await anime.save()

      if (user) {
        user.animeList = {
          ...user?.animeList,
          [name]: { progress: 0 },
        }

        await user?.save()
      }

      res.status(201).json(savedAnime)
    } catch (error) {
      console.error(error)

      if ((error as Error).name === 'ValidationError') {
        if (user && !Object.keys(user?.animeList).includes(name)) {
          user.animeList = {
            ...user?.animeList,
            [name]: { progress: 0 },
          }

          await user?.save()

          return res.status(201).json({
            info: 'Anime successfully added!',
            name,
          })
        }

        return res.status(400).json({
          error: 'This anime is already in your list!',
          name,
        })
      }

      return next(error)
    }
  }
)
