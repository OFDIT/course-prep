import { z } from 'zod'

// Search type
const SectionSearchMetadata = z.object({
    term: z.string().default(''),
    filter: z.enum(['10', '50', '100']).default('10').transform(String),
    search: z.string().default(''),
    recordCount: z.number().default(0),
})

export type SectionSearchMetadata = z.infer<typeof SectionSearchMetadata>

const SectionRecord = z.object({
    id: z.coerce.number(),
    cf_course_id: z.coerce.number(),
    cf_term_id: z.coerce.number(),
    program: z.string(),
    program_id: z.coerce.number(),
    course: z.string(),
    course_subject: z.string(),
    course_number: z.coerce.number(),
    course_title: z.string(),
    session: z.string(),
    instructor_name: z.string(),
    source_course_id: z.string().optional(),
    who_copies: z.enum(['AD', 'OFDIT', 'Instructor']).optional(),
    status: z.string().optional(),
    resp_party: z.string().optional(),
    cf_status: z.string().optional(),
    term: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    bb_course_id: z.string(),
    task_queue_date: z.string().optional(),
    ready_for_copy_date: z.string().optional(),
    course_copied_date: z.string().optional(),
    ready_for_qa_date: z.string().optional(),
    qa_finished_date: z.string().optional(),
    copy_error_date: z.string().optional(),
    course_recopied_date: z.string().optional(),
    ready_to_open_date: z.string().optional(),
    is_copied: z.boolean().default(false),
    is_ready_to_open: z.boolean().default(false),
    qa_assigned_id: z.coerce.number().optional(),
    qa_assigned_name: z.string().optional(),
})

export type SectionRecord = z.infer<typeof SectionRecord>

export type preprocessedSectionRecord = {
    acad_org: string,
    session: string,
    cf_term_id: number,
    cf_status: string,
    course_subject: string,
    course_number: number,
    section_number: string,
    course_title: string,
    cf_course_id: number,
    instructor_name?: string,
    start_date: string,
    end_date: string,
    bb_course_id: string,
    cp_cycle_id: number,
}
