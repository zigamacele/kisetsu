import { NextFunction, Request, Response } from 'express'
import User from '../models/user'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { config } from '../utils/config'
import dayjs from 'dayjs'

export const checkAuthorizationHeader = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  if (!request.headers.authorization) {
    return response.status(403).json({ error: 'No credentials sent!' })
  }

  const user = await User.findOne({ jwt: request.headers.authorization })
  if (user) {
    const decodedToken = jwt.verify(
      user.jwt ?? '',
      config.database['SECRET']
    ) as JwtPayload

    if (!(decodedToken.exp && decodedToken.exp < dayjs().unix())) {
      return next()
    }

    return response.status(401).json({
      error: 'Token expired!',
    })
  }

  return response.status(403).json({ error: 'Please login!' })
}
