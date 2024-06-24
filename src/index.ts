import { exec } from 'node:child_process'
import cors from 'cors'
import 'dotenv/config'
import express, {
    type Express,
    type NextFunction,
    type Response,
    type Request,
} from 'express'
import sql from 'mssql'
import nunjucks from 'nunjucks'
import { z } from 'zod'
import log from './logger.js'
import { CoursePrepRouter } from './coursePrep_routes.js'

export const app: Express = express()

// Grab version from git tag
export const version = exec("git describe --tags", (error, stdout, stderr) => {
    if (error) {
        log.error(`${error.message}`)
        return 'N/A'
    }
    if (stderr) {
        log.error(`${stderr}`)
        return 'N/A'
    }
    const version = stdout.trim()
    log.info(`📚 CoursePrep service version: ${version}`)
    return version
})

// Config schema
const envVariables = z.object({
    NODE_ENV: z.enum(['production', 'development']),
    PORT: z.coerce.number(),
    DB_DATABASE: z.string(),
    DB_SERVER: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    REDIS_SERVER: z.string(),
    REDIS_PORT: z.coerce.number(),
})
export const env = envVariables.parse(process.env)
log.info('Processed configuration from environment variables', { environment: env })

// Express configs and middleware
app.use(express.json())
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('assets'))

// Templating
nunjucks.configure('views', {
    express: app,
    noCache: env.NODE_ENV !== 'production',
})

// Routes
app.use('/', CoursePrepRouter)

// Master error function
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof Error) {
        const errorMessage = `${err.name}: ${err.message}`
        log.error(errorMessage, { error_details: err })
        res.status(500).send(errorMessage)
    }
})

// Database
// We attempt to connect to the DB pool, store the pool in the app's locals, and then use that *single* pool throughout the life-cycle of the app

// DB config
const dbConfig = {
    database: env.DB_DATABASE,
    server: env.DB_SERVER,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    pool: {
        min: 0,
        max: 10,
    },
    options: {
        trustServerCertificate: true,
    },
}
const { ConnectionPool } = sql
const appPool = new ConnectionPool(dbConfig)
appPool
    .connect()
    .then((pool) => {
        app.locals.db = pool
        log.info(`🚀 Connected to database ${env.DB_DATABASE}@${env.DB_SERVER}`)
    })
    .catch((err) => {
        if (err instanceof sql.ConnectionError) {
            log.error(`${err.name}/${err.code}: ${err.message}`, { err })
        } else if (err instanceof Error) {
            log.error(`${err.name}: ${err.message}`, { err })
        }
    })
