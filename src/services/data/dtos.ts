export type IdentifiableEntity = {
    id: number
}

export type Candidate = IdentifiableEntity & {
    name: string
    stage: InterviewStageType
    previousStage: InterviewStageType
    phone: string
    currentRole: string
    profilePicture: string
    summary: string
    dateApplied: Date
    comments: Comment[]
    locationId: number
    location: Location
    positionId: number
    position: Position
    interviews: Interview[]
}

export enum InterviewStageType {
    Applied,
    Screening,
    Interviewing,
    Offered
}

export type Comment = IdentifiableEntity & {
    candidateId: number
    text: string
    authorName: string
    authorRole: string
    authorProfilePicture: string
}

export type Location = IdentifiableEntity & {
    city: string
    state: string
    locationAddress: string
}

export type Recruiter = IdentifiableEntity & {
    name: string
    alias: string
    profilePicture: string
    role: RecruiterRole
    directReportIds: string
    positions: Position[]
}

export enum RecruiterRole {
    HiringManager,
    HRStaff,
    Interviewer
}

export type Position = IdentifiableEntity & {
    title: string
    daysOpen: number
    level: number
    description: string
    hiringManagerId: number
    hiringManager: Recruiter
    locationId: number
    location: Location
    candidates: Candidate[]
}

export type Interview = IdentifiableEntity & {
    interviewDate: Date
    feedbackText?: string
    candidateId: number
    recruiterId: number
    recruiter?: Recruiter
}