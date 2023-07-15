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

animeRouter.put(
  '/update/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { airDate, numOfEpisodes } = req.body
      const { authorization } = req.headers

      const user = await User.findOne({ jwt: authorization })
      const anime = await Anime.findOne({ _id: id })

      if (anime && user?._id.toString() === anime.owner) {
        airDate && (anime.airDate = airDate)
        numOfEpisodes && (anime.numOfEpisodes = numOfEpisodes)

        if (!airDate && !numOfEpisodes) {
          return res.status(400).json({ error: 'Nothing to update!' })
        }

        await anime.save()

        return res
          .status(200)
          .json({ info: `${anime.name} was updated!`, anime })
      }

      if (!anime) {
        return res.status(404).json({ error: 'Anime not found!' })
      }

      if (user?._id.toString() !== anime.owner) {
        return res
          .status(403)
          .json({ error: 'You are not the owner of this anime!' })
      }
    } catch (error) {
      return next(error)
    }
  }
)

animeRouter.delete(
  '/delete/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params
      const { authorization } = req.headers

      const user = await User.findOne({ jwt: authorization })
      const anime = await Anime.findOne({ _id: id })

      if (anime && user?._id.toString() === anime.owner) {
        const updatedAnimeList = { ...user.animeList }
        delete updatedAnimeList[anime.name]
        user.animeList = updatedAnimeList

        await Anime.deleteOne({ _id: anime._id })

        await user?.save()

        return res.status(200).json({ info: `${anime.name} was deleted!` })
      }

      if (!anime) {
        return res.status(404).json({ error: 'Anime not found!' })
      }

      if (user?._id.toString() !== anime.owner) {
        return res
          .status(403)
          .json({ error: 'You are not the owner of this anime!' })
      }
    } catch (error) {
      return next(error)
    }
  }
)
