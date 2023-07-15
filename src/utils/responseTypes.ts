import { Response } from 'express'

export const CustomSuccessfulResponse = <T>(res: Response, output: T) => {
  return res.status(200).send(output)
}

export const SuccessfulyCreatedResponse = <T>(res: Response, output: T) => {
  return res.status(201).send(output)
}

export const MissingErrorResponse = (res: Response, missing: string) => {
  return res.status(400).send({ error: `${missing} is required.` })
}

export const CustomErrorResponse = <T>(res: Response, output: T) => {
  return res.status(400).send(output)
}

export function BadRequestErrorResponse(res: Response) {
  return res.status(400).send({ error: 'Bad request.' })
}

export function AuthFailedErrorResponse(res: Response) {
  return res.status(401).send({ error: 'Auth failed.' })
}

export function ForbiddenErrorResponse(res: Response) {
  return res.status(403).send({ error: 'Insufficient permissions' })
}

export function NotFoundErrorResponse(res: Response) {
  return res.status(404).send({ error: 'Not found.' })
}

export function UnknownEndpointErrorResponse(res: Response) {
  return res.status(404).send({ error: 'Unknown endpoint.' })
}
