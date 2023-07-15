import { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'
import {
  AuthFailedErrorResponse,
  CustomErrorResponse,
  UnknownEndpointErrorResponse,
} from '../utils/responseTypes'

export const unknownEndpoint = (_req: Request, res: Response) => {
  UnknownEndpointErrorResponse(res)
}

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return CustomErrorResponse(res, { error: 'Malformatted Id.' })
  } else if (error.name === 'ValidationError') {
    return CustomErrorResponse(res, { error: error.message })
  } else if (error.name === 'JsonWebTokenError') {
    return CustomErrorResponse(res, { error: error.message })
  } else if (error.name === 'TokenExpiredError') {
    return AuthFailedErrorResponse(res)
  }

  return next(error)
}
