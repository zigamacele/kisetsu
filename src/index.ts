import app from './app'
import { config } from './utils/config'
import { logger } from './utils/logger'

app.listen(config.app['PORT'], () => {
  logger.info(`Server running on port ${config.app['PORT']}`)
})
