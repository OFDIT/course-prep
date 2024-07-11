import express, {
  type Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import log from './logger.js'
import type { SectionSearchMetadata, SectionRecord } from './coursePrep_types.js'
import type { User } from './common_types.js'
import multer from 'multer'
import csv from 'csvtojson'


const router: Router = express.Router()
const upload = multer({ dest: 'uploads/' })

const authorizeAndAuthenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Add authorization and authentication, this is just for scaffolding
  res.locals.user =
  {
    id: 9,
    full_name: "José Muñiz",
    first_name: "José",
    last_name: "Muñiz",
    program: "OFDIT",
    program_id: 14,
    email_address: "jose.muniz@cuny.edu",
    gmail_address: "sps.ofdit@gmail.com",
    job_title: "Data Systems & Operations Manager",
    extension: 48631,
    is_grizzly_admin: true,
    is_grizzly_user: true,
    is_active: true,
    active_until_date: null,
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiZnVsbF9uYW1lIjoiSm9zw6kgTXXDsWl6IiwiZmlyc3RfbmFtZSI6Ikpvc8OpIiwibGFzdF9uYW1lIjoiTXXDsWl6IiwicHJvZ3JhbSI6Ik9GRElUIiwicHJvZ3JhbV9pZCI6MTQsImVtYWlsX2FkZHJlc3MiOiJqb3NlLm11bml6QGN1bnkuZWR1IiwiZ21haWxfYWRkcmVzcyI6InNwcy5vZmRpdEBnbWFpbC5jb20iLCJqb2JfdGl0bGUiOiJEYXRhIFN5c3RlbXMgJiBPcGVyYXRpb25zIE1hbmFnZXIiLCJleHRlbnNpb24iOjQ4NjMxLCJpc19ncml6emx5X2FkbWluIjp0cnVlLCJpc19ncml6emx5X3VzZXIiOnRydWUsImlzX2FjdGl2ZSI6dHJ1ZSwiYWN0aXZlX3VudGlsX2RhdGUiOm51bGwsImlhdCI6MTcxMjY2MzA2MywiZXhwIjoxNzEzOTU5MDYzfQ.FmbfkgX85lv13NBIdk3jv5P6d1A5cqTnSXYtBeJlJuo"
  }
  next()
}

// Routes
router.get('/import', async (req: Request, res: Response, next: NextFunction) => {
  res.render('import.html', { title: 'Import' })
})

router.post('/import', upload.single('import'), async (req: Request, res: Response, next: NextFunction) => {
  const filePath = req.file?.path

  // TODO: throw a proper error and use master error handler
  if (!filePath) {
    res.status(400).send('No file uploaded')
    return
  }

  const sections = await csv().fromFile(filePath)

  // TODO: 
  // 1. Validate the data
  // 2. Create section type
  // 3. Process sections and transform fields
  // 4. Load records from json array
  // 5. Send to DB
  // 6. Send HTML response

  log.info(`Imported ${sections.length} sections from ${req.file?.originalname}`)
  res.json(sections)
})

export { router as CoursePrepRouter }