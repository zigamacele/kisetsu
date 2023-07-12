import mongoose from 'mongoose'
import uniqueValidator from 'mongoose-unique-validator'

interface IUser {
  username: string
  name: string
  passwordHash: string
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
  },
  name: String,
  passwordHash: { type: String, required: true, minlength: 8 },
})

userSchema.plugin(uniqueValidator)

userSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject['id'] = returnedObject['_id'].toString()
    delete returnedObject['_id']
    delete returnedObject['__v']
    delete returnedObject['passwordHash']
  },
})

const User = mongoose.model<IUser>('User', userSchema)

export default User
