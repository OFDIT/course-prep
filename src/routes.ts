import express, {
  type Router,
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import type { SectionSearchMetadata, SectionRecord } from './cp_types.js'
import type { User } from './common_types.js'
import multer from 'multer'
import { importCoursePrepSections } from './controller.js'

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

router.post('/import', upload.single('import'), importCoursePrepSections)
router.get('/sections', async (req: Request, res: Response, next: NextFunction) => {
  if (req.query.filter) {
    console.log(req.query.filter)
  }
})
export { router as CoursePrepRouter }