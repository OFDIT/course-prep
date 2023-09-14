import express, { Request, Response } from 'express'
import { z } from 'zod'
import 'dotenv/config'
import * as sql from 'mssql'
import nunjucks from 'nunjucks'

const app = express()

// Process .env config
const envVariables = z.object({
  PORT: z.coerce.number(),
  DB_DATABASE: z.string(),
  DB_SERVER: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  TMPL_NOCACHE: z.coerce.boolean(),
})
const env = envVariables.parse(process.env)

// Express configs and middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('assets'))

// Templating
nunjucks.configure('views', {
  express: app,
  noCache: env.TMPL_NOCACHE,
})

// DB
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

// Routes
app.get('/', async (req: Request, res: Response) => {
  await sql.connect(dbConfig)
  const response = await sql.query`select * from uvw_person order by last_name`
  return res.render('person.html', { data: response.recordset })
})

app.listen(env.PORT, () => {
  console.log(`Started on port ${env.PORT}`)
})
