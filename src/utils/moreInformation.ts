import Anime from '../models/anime'

export interface AnimeList {
  [key: string]: { [key: string]: number | string | Date }
}
export const addAnimeInformationFromDB = async (animeList: AnimeList) => {
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
