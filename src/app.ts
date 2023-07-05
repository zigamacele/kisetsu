import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import { registerRouter } from './controllers/register'
import {
  errorHandler,
  requestLogger,
  unknownEndpoint,
} from './middleware/errorHandling'
import { config } from './utils/config'
import { logger } from './utils/logger'

const app = express()

mongoose
  .connect(config.database['DB_HOST'])
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch(() => {
    logger.error('error connecting to MongoDB:')
  })

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.use('/register', registerRouter)

app.use(unknownEndpoint)
app.use(errorHandler)

export default app
