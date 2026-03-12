import { google, calendar_v3 } from "googleapis"

type Slot = { start: string; end: string }

const SCOPES = ["https://www.googleapis.com/auth/calendar"]

const getJwtClient = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n")

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL/GOOGLE_PRIVATE_KEY")
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES
  })
}

const getCalendar = () => {
  const auth = getJwtClient()
  return google.calendar({ version: "v3", auth })
}

export const getAvailableSlots = async (opts: {
  dateISO: string
  durationMinutes: number
  timeZone?: string
  calendarId?: string
  workStartHour?: number
  workEndHour?: number
}): Promise<Slot[]> => {
  const {
    dateISO,
    durationMinutes,
    timeZone = "UTC",
    calendarId = process.env.GOOGLE_CALENDAR_ID || "primary",
    workStartHour = 9,
    workEndHour = 17
  } = opts

  const date = new Date(dateISO)
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  let busy: Array<{ start?: string | null; end?: string | null }> = []
  const hasCreds =
    !!process.env.GOOGLE_CLIENT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY
  if (hasCreds) {
    try {
      const calendar = getCalendar()
      const fb = await calendar.freebusy.query({
        requestBody: {
          timeMin: dayStart.toISOString(),
          timeMax: dayEnd.toISOString(),
          items: [{ id: calendarId }]
        }
      })
      busy = fb.data.calendars?.[calendarId]?.busy || []
    } catch (err) {
      busy = []
    }
  } else {
    busy = []
  }

  const workStart = new Date(date)
  workStart.setHours(workStartHour, 0, 0, 0)
  const workEnd = new Date(date)
  workEnd.setHours(workEndHour, 0, 0, 0)

  const slots: Slot[] = []
  let cursor = new Date(workStart)
  const slotMs = durationMinutes * 60 * 1000

  const isFree = (start: Date, end: Date) =>
    busy.every(b => {
      const bStart = new Date(b.start as string).getTime()
      const bEnd = new Date(b.end as string).getTime()
      return end.getTime() <= bStart || start.getTime() >= bEnd
    })

  while (cursor.getTime() + slotMs <= workEnd.getTime()) {
    const slotStart = new Date(cursor)
    const slotEnd = new Date(cursor.getTime() + slotMs)
    if (isFree(slotStart, slotEnd)) {
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString()
      })
    }
    cursor = new Date(cursor.getTime() + slotMs)
  }

  return slots
}

export const createInterviewEvent = async (opts: {
  calendarId?: string
  summary: string
  description?: string
  startISO: string
  endISO: string
  timeZone?: string
  attendees: { email: string }[]
}): Promise<{ eventId: string; hangoutLink?: string }> => {
  const {
    calendarId = process.env.GOOGLE_CALENDAR_ID || "primary",
    summary,
    description = "",
    startISO,
    endISO,
    timeZone = "UTC",
    attendees
  } = opts

  const calendar = getCalendar()

  const resp = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary,
      description,
      start: { dateTime: startISO, timeZone },
      end: { dateTime: endISO, timeZone },
      attendees,
      conferenceData: {
        createRequest: {
          requestId: `smartRecruit-${Date.now()}`
        }
      }
    },
    conferenceDataVersion: 1,
    sendUpdates: "all"
  } as calendar_v3.Params$Resource$Events$Insert)

  const eventId = resp.data.id as string
  const rawHangoutLink =
    resp.data.hangoutLink ??
    resp.data.conferenceData?.entryPoints?.find(e => e.entryPointType === "video")?.uri
  const hangoutLink = rawHangoutLink ?? undefined

  return { eventId, hangoutLink }
}
