import fs from 'node:fs'
import express, {
    type Request,
    type Response,
    type NextFunction,
} from 'express'
import csv from 'csvtojson'
import log from './logger.js'
import createError from 'http-errors'
import type { preprocessedSectionRecord } from './cp_types.js'
import Logger from './logger.js'
import sql from 'mssql'

export const importCoursePrepSections = async (req: Request, res: Response, next: NextFunction) => {
    const filePath = req.file?.path

    if (!filePath) {
        return next(createError(400, 'No file uploaded'))
    }

    const importedSections = await csv().fromFile(filePath)
    const sectionsFromCSV = importedSections.length
    // Validate the data
    // TODO: more refined validation
    const columns = Object.keys(importedSections[0])
    if (columns.length !== 25 || columns[0] !== 'Institution') {
        return next(createError(400, 'Invaild data file. Please check the data format.'))
    }

    log.debug("Finished validation")

    // Process sections (except instructor_name)
    let sections = importedSections.map((section: Record<string, string | number>) => {
        const preprocessedSection: preprocessedSectionRecord = {
            acad_org: String(section['Acad Org']),
            session: String(section.Session),
            cf_term_id: Number(section.Term),
            cf_status: String(section['Class Stat']),
            course_subject: String(section.Subject),
            course_number: Number(section['Catalog#']),
            section_number: String(section.Section),
            course_title: String(section['Class Title']),
            cf_course_id: Number(section['Class#']),
            start_date: String(section['Start Date']),
            end_date: String(section['End Date']),
            bb_course_id: String(section['Blackboard Course ID']),
            instructor_name: String(section.Name),
            // FIXME: Generate cp_cycle_id instead of using a hardcoded value
            cp_cycle_id: Number(section.Session === 'WIN' ? 11 : 12),
        }
        return preprocessedSection
    })

    const transformAcadOrgs = (section: preprocessedSectionRecord) => {
        if (section.acad_org === 'HRL-SPS') {
            return 'SOC-SPS'
        }
        if (section.acad_org === 'ILAW-SPS') {
            return 'SOC-SPS'
        }
        if (section.acad_org === 'LBL-SPS') {
            return 'LARTS-SPS'
        }
        if (section.acad_org === 'RAC-SPS') {
            return 'SPS-SPS'
        }
        if (section.acad_org === 'MST-SPS') {
            return 'SPS-SPS'
        }
        if (section.course_subject === 'EDUC' || section.course_subject === 'ECE') {
            return 'ECLD-SPS'
        }
        if (section.course_subject === 'MGMT') {
            return 'SOC-SPS'
        }
        return section.acad_org
    }

    const transformBBCourseIDs = (section: preprocessedSectionRecord) => {
        return `SPS01_${section.course_subject}_${section.course_number}_${section.cf_term_id}_${section.cf_course_id}`
    }

    sections = sections.map((section: preprocessedSectionRecord) => {
        if (section.acad_org) {
            section.acad_org = transformAcadOrgs(section) as string
        }
        if (section.bb_course_id) {
            section.bb_course_id = transformBBCourseIDs(section) as string
        }
        return section
    })

    log.debug(`Finished transforming section fields: ${sections.length} sections`)

    sections = sections.filter((section: preprocessedSectionRecord) => {
        return section.acad_org !== 'REG-SPS' && section.acad_org !== 'THTR-SPS' && section.acad_org !== 'AMNH-SPS'
    })

    log.debug(`Finished removing sections from select acad_orgs: ${sections.length} sections`)

    const instructors: Record<string, string[]> = {}

    // biome-ignore lint/complexity/noForEach: <explanation>
    sections.forEach((section: preprocessedSectionRecord) => {
        if (!section.instructor_name) {
            return
        }
        const idx = `${section.course_subject}_${section.course_number}_${section.section_number}`
        if (!instructors[idx]) {
            instructors[idx] = [section.instructor_name]
        } else {
            instructors[idx]?.push(section.instructor_name)
        }
    })

    sections = sections.map((section: preprocessedSectionRecord) => {
        const idx = `${section.course_subject}_${section.course_number}_${section.section_number}`
        section.instructor_name = instructors[idx]?.join('/')
        return section
    })

    log.debug(`Finished matching all instructors to section records: ${sections.length} sections`)

    // Remove duplicate records (multiple instructors are reported as duplicate course records)
    function removeDuplicates(arr: preprocessedSectionRecord[]) {
        const uniqueSet = new Set();
        const uniqueArr = [];

        for (const obj of arr) {
            const keyValue = obj.cf_course_id;
            if (!uniqueSet.has(keyValue)) {
                uniqueSet.add(keyValue);
                uniqueArr.push(obj);
            }
        }

        return uniqueArr;
    }
    sections = removeDuplicates(sections)

    log.debug(`Removed duplicate records: ${sections.length} sections`)

    // DATABASE WORKFLOW
    // a. Trunate the cp_processed table
    // b. Create table instance
    // c. Add rows by iterating through sections
    // d. Use a bulk instance to insert rows
    // e. Call usp_merge_cp_import
    try {
        await req.app.locals.db
            .query`truncate table cp_processed`
        const table = new sql.Table('cp_processed')
        table.create = true
        // create table if it doesn't exist
        table.columns.add('acad_org', sql.NVarChar(50), { nullable: false })
        table.columns.add('session', sql.VarChar(50), { nullable: false })
        table.columns.add('cf_term_id', sql.SmallInt, { nullable: false })
        table.columns.add('cf_status', sql.NVarChar(50), { nullable: false })
        table.columns.add('course_subject', sql.NVarChar(50), { nullable: false })
        table.columns.add('course_number', sql.Int, { nullable: false })
        table.columns.add('section_number', sql.VarChar(50), { nullable: false })
        table.columns.add('course_title', sql.NVarChar(50), { nullable: false })
        table.columns.add('cf_course_id', sql.Int, { nullable: false })
        table.columns.add('start_date', sql.Date, { nullable: false })
        table.columns.add('end_date', sql.Date, { nullable: false })
        table.columns.add('bb_course_id', sql.NVarChar(50), { nullable: false })
        table.columns.add('instructor_name', sql.NVarChar(100), { nullable: true })
        table.columns.add('cp_cycle_id', sql.SmallInt, { nullable: false })

        for (const section of sections) {
            table.rows.add(
                section.acad_org,
                section.session,
                section.cf_term_id,
                section.cf_status,
                section.course_subject,
                section.course_number,
                section.section_number,
                section.course_title,
                section.cf_course_id,
                section.start_date,
                section.end_date,
                section.bb_course_id,
                section.instructor_name ?? null,
                section.cp_cycle_id)
        }
        const response = await new sql.Request(req.app.locals.db).bulk(table)
        log.debug(`Finished sending sections to Database uploaded ${response.rowsAffected} rows`)

        const responseFromSP = await new sql.Request(req.app.locals.db).execute('usp_cp_merge_import')

        log.info(`Imported ${sections.length} sections from ${req.file?.originalname}`)
        res.render('includes/success_output.html', { success: true, sectionsImported: sections.length, sectionsFromCSV: sectionsFromCSV, responseFromSP: responseFromSP.recordset })

    } catch (err) {
        return next(err)
    }
}