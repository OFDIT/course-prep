import winston from 'winston'
import Transport from 'winston-transport'
import { Worker } from 'bullmq'
import 'dotenv/config'
import { logQueue } from './queues.js'

class GrizzlyTransport extends Transport {
  constructor(opts: object) {
    super(opts)
  }
  log(info: unknown, callback: () => void) {
    logQueue?.add('grizzly-logs', info)
    callback()
  }
}

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
  new GrizzlyTransport({
    level: level(),
    format: winston.format.combine(
      winston.format.json(),
      winston.format.metadata(),
      winston.format.uncolorize(),
    ),
  }),
]

const Logger = winston.createLogger({
  level: level(),
  levels,
  defaultMeta: { service: 'course-prep', node_env: process.env.NODE_ENV },
  format,
  transports,
})

const worker = new Worker(
  'grizzly-logs',
  async (job) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify(job.data, null, 2))
    }
  },
  {
    // Normally, we'd use the env that has been cleared by zod, but this gets run before we have a chance to do the zod validation.
    connection: {
      host: process.env.REDIS_SERVER,
      port: Number(process.env.REDIS_PORT),
    },
  },
)

export default Logger
