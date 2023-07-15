import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

interface AnimeSchema {
  name: string
  airDate: Date
  numOfEpisodes: number
  owner: string
}

const animeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  airDate: { type: Date, required: true },
  numOfEpisodes: { type: Number, default: 0 },
  owner: { type: String },
})

animeSchema.plugin(uniqueValidator)

animeSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject['id'] = returnedObject['_id'].toString()
    delete returnedObject['_id']
    delete returnedObject['__v']
  },
})

const Anime = mongoose.model<AnimeSchema>('Anime', animeSchema)

export default Anime
