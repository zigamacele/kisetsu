import mongoose, { Schema } from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

interface UserSchema {
  username: string
  name: string
  passwordHash: string
  jwt: string | null
  animeList: { [key: string]: string | number }
}

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
    },
    name: String,
    passwordHash: { type: String, required: true, minlength: 8 },
    jwt: { default: null, type: String },
    animeList: { type: Schema.Types.Mixed, default: {} },
  },
  { minimize: false }
)

userSchema.plugin(uniqueValidator)

userSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject['id'] = returnedObject['_id'].toString()
    delete returnedObject['_id']
    delete returnedObject['__v']
    delete returnedObject['passwordHash']
  },
})

const User = mongoose.model<UserSchema>('User', userSchema)

export default User
