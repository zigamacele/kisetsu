import dayjs, { Dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Anime from '../models/anime'

dayjs.extend(relativeTime)

export interface AnimeList {
  [key: string]: { [key: string]: number | string | Date | Dayjs }
}

export const getAnimeInformationFromDB = async (animeList: AnimeList) => {
  const animeInDB = await Anime.find({})
  const updatedAnimeList = { ...animeList }

  for (const animeName in updatedAnimeList) {
    const anime = animeInDB.find((anime) => anime.name === animeName)

    if (anime) {
      updatedAnimeList[animeName] = {
        ...updatedAnimeList[animeName],
        airDate: anime.airDate,
        numOfEpisodes: anime.numOfEpisodes,
      }
    }
  }

  return updatedAnimeList
}

const episodesBehind = (
  airDate: string | Date,
  progress: number | string | Date | Dayjs
) => {
  const startedAiring = dayjs(airDate)
  const output = Math.floor(
    Math.abs(startedAiring.diff(dayjs(), 'day') / 7) + 1
  )

  if (output - Number(progress) < 0) {
    return 0
  }

  if (Number(progress) > 0) {
    return output - Number(progress)
  }

  return output
}

const nextEpisode = (airDate: Date | string) => {
  const startedAiring = dayjs(airDate)
  const weeksSinceStarted = Math.floor(
    Math.abs(startedAiring.diff(dayjs(), 'day') / 7)
  )

  return startedAiring.add(weeksSinceStarted * 7, 'day').format('DD.MM.YYYY')
}

const lastEpisode = (airDate: Date | string) => {
  const startedAiring = dayjs(airDate)
  const weeksSinceStarted = Math.floor(
    Math.abs(startedAiring.diff(dayjs(), 'day') / 7)
  )

  return startedAiring.add(weeksSinceStarted * 7, 'day').fromNow()
}

export const getScheduleInformation = async (animeList: AnimeList) => {
  const animeInDB = await Anime.find({})
  const updatedAnimeList = { ...animeList }

  for (const animeName in updatedAnimeList) {
    const anime = animeInDB.find((anime) => anime.name === animeName)

    if (anime) {
      const progress = updatedAnimeList[animeName]?.['progress'] ?? 0

      updatedAnimeList[animeName] = {
        nextEpisode: nextEpisode(anime.airDate),
        lastEpisode: lastEpisode(anime.airDate),
        episodesBehind: episodesBehind(anime.airDate, progress),
        progress,
        numOfEpisodes: anime.numOfEpisodes,
      }
    }
  }

  return updatedAnimeList
}
