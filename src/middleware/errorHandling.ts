import { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'

export const requestLogger = (
  request: Request,
  _response: Response,
  next: NextFunction
) => {
  logger.info('Method', request.method)
  logger.info('Path', request.path)
  logger.info('Body', request.body)
  logger.info('---')

  next()
}

export const unknownEndpoint = (_request: Request, response: Response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

export const errorHandler = (
  error: Error,
  _request: Request,
  _response: Response,
  next: NextFunction
) => {
  logger.error(error.message)

  next()
}
