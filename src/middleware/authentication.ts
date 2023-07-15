import { NextFunction, Request, Response } from 'express'
import User from '../models/user'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { config } from '../utils/config'
import dayjs from 'dayjs'
import {
  AuthFailedErrorResponse,
  ForbiddenErrorResponse,
} from '../utils/responseTypes'

export const checkAuthorizationHeader = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    return ForbiddenErrorResponse(res)
  }

  const user = await User.findOne({ jwt: req.headers.authorization })
  if (user) {
    const decodedToken = jwt.verify(
      user.jwt ?? '',
      config.database['SECRET']
    ) as JwtPayload

    if (!(decodedToken.exp && decodedToken.exp < dayjs().unix())) {
      return next()
    }

    return AuthFailedErrorResponse(res)
  }

  return ForbiddenErrorResponse(res)
}
