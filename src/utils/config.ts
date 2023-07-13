import { logger } from './logger'

export const config = {
  app: { PORT: getConfig('PORT') },
  database: { DB_HOST: getConfig('DB_HOST'), SECRET: getConfig('SECRET') },
}

function getConfig(envKey: string): string {
  const envValue = process.env[envKey]
  if (envValue === undefined) {
    logger.error(`Config key ${envKey} is undefined.`)
    throw new Error('Bad config.')
  }

  return envValue
}
