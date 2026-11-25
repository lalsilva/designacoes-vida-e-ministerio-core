import {
  AssignmentStatus,
  IAssignment,
  ICalendarEvent,
  IValidationResult,
  ValidationReasonCode,
} from "../types";

/**
 * Checks whether two Date instances represent the same UTC calendar day.
 */
function isSameUtcDate(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
    dateA.getUTCMonth() === dateB.getUTCMonth() &&
    dateA.getUTCDate() === dateB.getUTCDate()
  );
}

/**
 * Checks whether two Date instances fall within the same calendar month and year (UTC).
 */
function isSameUtcMonth(dateA: Date, dateB: Date): boolean {
  return (
    dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
    dateA.getUTCMonth() === dateB.getUTCMonth()
  );
}

/**
 * Returns the UTC timestamp for the Monday (00:00:00) of the service week containing the given date.
 * Weeks are evaluated from Monday to Sunday so weekend events (Assemblies/Conventions)
 * accurately match the midweek meeting of that same week.
 */
function getWeekStartUtcTimestamp(date: Date): number {
  const utcDay = date.getUTCDay(); // 0 (Sun) to 6 (Sat)
  const diffToMonday = utcDay === 0 ? -6 : 1 - utcDay;
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + diffToMonday,
  );
}

/**
 * Validates whether a midweek meeting can take place on the given date,
 * ensuring no special calendar event cancels that week's meeting.
 *
 * @param meetingDate - The scheduled date of the midweek meeting.
 * @param calendarEvents - List of registered special calendar events.
 * @returns An {@link IValidationResult} indicating whether the meeting date is available.
 */
export function validateMeetingDateAvailability(
  meetingDate: Date,
  calendarEvents: ICalendarEvent[],
): IValidationResult {
  const meetingWeekStart = getWeekStartUtcTimestamp(meetingDate);

  const cancelingEvent = calendarEvents.find(
    (event) =>
      event.cancelsMidweekMeeting &&
      getWeekStartUtcTimestamp(event.eventDate) === meetingWeekStart,
  );

  if (cancelingEvent) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.MEETING_CANCELED_BY_EVENT,
    };
  }

  return { isValid: true };
}

/**
 * Validates whether a publisher can be assigned to a specific part on a given date
 * without violating scheduling conflict rules:
 *
 * 1. **Same-meeting conflict**: A publisher cannot hold two assignments (as main assignee
 *    or assistant) on the same meeting date.
 * 2. **Monthly part repetition**: A publisher cannot be the main assignee for the exact same
 *    part more than once within the same calendar month.
 *
 * Canceled and substituted assignments are ignored during conflict checks.
 *
 * @param publisherId - The ID of the publisher being evaluated.
 * @param partId - The ID of the meeting part being assigned.
 * @param meetingDate - The date of the target meeting.
 * @param existingAssignments - Existing assignments to check against.
 * @returns An {@link IValidationResult} indicating whether there are any scheduling conflicts.
 */
export function validatePublisherScheduleConflicts(
  publisherId: string,
  partId: string,
  meetingDate: Date,
  existingAssignments: IAssignment[],
): IValidationResult {
  const activeAssignments = existingAssignments.filter(
    (assignment) =>
      assignment.status !== AssignmentStatus.Canceled &&
      assignment.status !== AssignmentStatus.Substituted,
  );

  const hasSameDayConflict = activeAssignments.some(
    (assignment) =>
      isSameUtcDate(assignment.meetingDate, meetingDate) &&
      (assignment.assigneeId === publisherId ||
        assignment.assistantId === publisherId),
  );

  if (hasSameDayConflict) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.PUBLISHER_ALREADY_ASSIGNED_ON_DATE,
    };
  }

  const hasMonthlyPartRepetition = activeAssignments.some(
    (assignment) =>
      isSameUtcMonth(assignment.meetingDate, meetingDate) &&
      assignment.partId === partId &&
      assignment.assigneeId === publisherId,
  );

  if (hasMonthlyPartRepetition) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.PUBLISHER_REPEATED_PART_IN_MONTH,
    };
  }

  return { isValid: true };
}
