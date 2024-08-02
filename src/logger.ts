import winston from 'winston'
import 'dotenv/config'

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isProduction = env === 'production'
  return isProduction ? 'info' : 'debug'
}

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ level: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`,
  ),
)

const transports = [
  new winston.transports.Console({
    format: format,
  }),
]

const Logger = winston.createLogger({
  level: level(),
  levels,
  defaultMeta: { service: 'course-prep', node_env: process.env.NODE_ENV },
  format,
  transports,
})

export default Logger
