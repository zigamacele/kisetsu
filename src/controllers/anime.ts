import { NextFunction, Request, Response, Router } from 'express'
import Anime from '../models/anime'

export const animeRouter = Router()

animeRouter.post(
  '/create',
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, airDate, numOfEpisodes } = req.body
    try {
      const anime = new Anime({ name, airDate, numOfEpisodes })

      const savedAnime = await anime.save()

      res.status(201).json(savedAnime)
    } catch (error) {
      console.error(error)

      if ((error as Error).name === 'ValidationError') {
        return res.status(400).json({ error: 'Anime already exists.' })
      }

      return next(error)
    }
  }
)
