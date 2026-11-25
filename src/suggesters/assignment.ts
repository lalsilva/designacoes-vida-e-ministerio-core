import {
  AssignmentStatus,
  IAssigneeCandidate,
  IAssignment,
  IAssistantCandidate,
  ICalendarEvent,
  IMeetingPart,
  IPublisher,
} from "../types";
import {
  validateAssigneeEligibility,
  validateAssistantEligibility,
} from "../validators/eligibility";
import {
  validateMeetingDateAvailability,
  validatePublisherScheduleConflicts,
} from "../validators/schedule";

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
 * Compares two nullable dates in ascending order, prioritizing `null` (never assigned) first,
 * followed by older timestamps.
 */
function compareNullableDatesAsc(
  dateA: Date | null,
  dateB: Date | null,
): number {
  if (dateA === null && dateB === null) {
    return 0;
  }
  if (dateA === null) {
    return -1;
  }
  if (dateB === null) {
    return 1;
  }
  return dateA.getTime() - dateB.getTime();
}

/**
 * Finds the most recent meeting date among a list of assignments, or `null` if empty.
 */
function getMostRecentDate(assignments: IAssignment[]): Date | null {
  if (assignments.length === 0) {
    return null;
  }

  return assignments.reduce<Date>(
    (latest, current) =>
      current.meetingDate.getTime() > latest.getTime()
        ? current.meetingDate
        : latest,
    assignments[0].meetingDate,
  );
}

/**
 * Filters assignments keeping only active (non-canceled, non-substituted) records.
 */
function getActiveAssignments(assignments: IAssignment[]): IAssignment[] {
  return assignments.filter(
    (assignment) =>
      assignment.status !== AssignmentStatus.Canceled &&
      assignment.status !== AssignmentStatus.Substituted,
  );
}

/**
 * Suggests and ranks eligible publishers to be the main assignee of a meeting part on a given date.
 *
 * Filtering rules:
 * - Returns an empty list if a special calendar event cancels the meeting week.
 * - Filters out publishers who fail S-38 eligibility rules ({@link validateAssigneeEligibility}).
 * - Filters out publishers with same-day or same-month part conflicts ({@link validatePublisherScheduleConflicts}).
 *
 * Ranking order (highest to lowest priority):
 * 1. Matches `part.targetPrivilege` (e.g., Ministerial Servants prioritized for Spiritual Gems).
 * 2. Longest time since handling this specific part (`null` / never assigned first).
 * 3. Longest time since handling any assignment (`null` / never assigned first).
 * 4. Alphabetical order by `fullName` for deterministic tie-breaking.
 *
 * @param publishers - Full list of congregation publishers.
 * @param part - The meeting part to be filled.
 * @param meetingDate - Target date of the midweek meeting.
 * @param existingAssignments - Historical and already scheduled assignments.
 * @param calendarEvents - Optional list of special calendar events to verify date availability.
 * @returns Ranked list of {@link IAssigneeCandidate} objects.
 */
export function suggestAssignees(
  publishers: IPublisher[],
  part: IMeetingPart,
  meetingDate: Date,
  existingAssignments: IAssignment[],
  calendarEvents: ICalendarEvent[] = [],
): IAssigneeCandidate[] {
  if (calendarEvents.length > 0) {
    const availability = validateMeetingDateAvailability(
      meetingDate,
      calendarEvents,
    );
    if (!availability.isValid) {
      return [];
    }
  }

  const activeAssignments = getActiveAssignments(existingAssignments);
  const pastAssignments = activeAssignments.filter(
    (assignment) =>
      !isSameUtcDate(assignment.meetingDate, meetingDate) &&
      assignment.meetingDate.getTime() < meetingDate.getTime(),
  );

  const candidates: IAssigneeCandidate[] = [];

  for (const publisher of publishers) {
    const eligibility = validateAssigneeEligibility(publisher, part);
    if (!eligibility.isValid) {
      continue;
    }

    const scheduleCheck = validatePublisherScheduleConflicts(
      publisher.id,
      part.id,
      meetingDate,
      existingAssignments,
    );
    if (!scheduleCheck.isValid) {
      continue;
    }

    const publisherPartHistory = pastAssignments.filter(
      (assignment) =>
        assignment.assigneeId === publisher.id && assignment.partId === part.id,
    );

    const publisherAnyHistory = pastAssignments.filter(
      (assignment) =>
        assignment.assigneeId === publisher.id ||
        assignment.assistantId === publisher.id,
    );

    candidates.push({
      publisher,
      matchesTargetPrivilege: Boolean(
        part.targetPrivilege && publisher.privilege === part.targetPrivilege,
      ),
      lastPartAssignmentDate: getMostRecentDate(publisherPartHistory),
      lastAnyAssignmentDate: getMostRecentDate(publisherAnyHistory),
    });
  }

  return candidates.sort((a, b) => {
    if (a.matchesTargetPrivilege !== b.matchesTargetPrivilege) {
      return a.matchesTargetPrivilege ? -1 : 1;
    }

    const partDateComparison = compareNullableDatesAsc(
      a.lastPartAssignmentDate,
      b.lastPartAssignmentDate,
    );
    if (partDateComparison !== 0) {
      return partDateComparison;
    }

    const anyDateComparison = compareNullableDatesAsc(
      a.lastAnyAssignmentDate,
      b.lastAnyAssignmentDate,
    );
    if (anyDateComparison !== 0) {
      return anyDateComparison;
    }

    return a.publisher.fullName.localeCompare(b.publisher.fullName);
  });
}

/**
 * Suggests and ranks eligible publishers to act as assistant for a given main assignee and part.
 *
 * Filtering rules:
 * - Returns an empty list if a special calendar event cancels the meeting week.
 * - Filters out candidates who fail S-38 assistant pairing rules ({@link validateAssistantEligibility}).
 * - Filters out candidates who already hold any active assignment on `meetingDate`.
 *
 * Ranking order (highest to lowest priority):
 * 1. Longest time since last acting as an assistant (`null` / never first).
 * 2. Longest time since handling any assignment (`null` / never first).
 * 3. Alphabetical order by `fullName` for deterministic tie-breaking.
 *
 * @param assignee - The main publisher already selected for the part.
 * @param publishers - Full list of congregation publishers.
 * @param part - The meeting part requiring an assistant.
 * @param meetingDate - Target date of the midweek meeting.
 * @param existingAssignments - Historical and already scheduled assignments.
 * @param calendarEvents - Optional list of special calendar events to verify date availability.
 * @returns Ranked list of {@link IAssistantCandidate} objects.
 */
export function suggestAssistants(
  assignee: IPublisher,
  publishers: IPublisher[],
  part: IMeetingPart,
  meetingDate: Date,
  existingAssignments: IAssignment[],
  calendarEvents: ICalendarEvent[] = [],
): IAssistantCandidate[] {
  if (calendarEvents.length > 0) {
    const availability = validateMeetingDateAvailability(
      meetingDate,
      calendarEvents,
    );
    if (!availability.isValid) {
      return [];
    }
  }

  const activeAssignments = getActiveAssignments(existingAssignments);
  const pastAssignments = activeAssignments.filter(
    (assignment) =>
      !isSameUtcDate(assignment.meetingDate, meetingDate) &&
      assignment.meetingDate.getTime() < meetingDate.getTime(),
  );

  const candidates: IAssistantCandidate[] = [];

  for (const candidate of publishers) {
    const pairingCheck = validateAssistantEligibility(
      assignee,
      candidate,
      part,
    );
    if (!pairingCheck.isValid) {
      continue;
    }

    const isBusyOnDate = activeAssignments.some(
      (assignment) =>
        isSameUtcDate(assignment.meetingDate, meetingDate) &&
        (assignment.assigneeId === candidate.id ||
          assignment.assistantId === candidate.id),
    );
    if (isBusyOnDate) {
      continue;
    }

    const assistantHistory = pastAssignments.filter(
      (assignment) => assignment.assistantId === candidate.id,
    );

    const anyHistory = pastAssignments.filter(
      (assignment) =>
        assignment.assigneeId === candidate.id ||
        assignment.assistantId === candidate.id,
    );

    candidates.push({
      publisher: candidate,
      isSameFamily: Boolean(
        assignee.familyGroupId &&
        assignee.familyGroupId === candidate.familyGroupId,
      ),
      lastAssistantAssignmentDate: getMostRecentDate(assistantHistory),
      lastAnyAssignmentDate: getMostRecentDate(anyHistory),
    });
  }

  return candidates.sort((a, b) => {
    const assistantDateComparison = compareNullableDatesAsc(
      a.lastAssistantAssignmentDate,
      b.lastAssistantAssignmentDate,
    );
    if (assistantDateComparison !== 0) {
      return assistantDateComparison;
    }

    const anyDateComparison = compareNullableDatesAsc(
      a.lastAnyAssignmentDate,
      b.lastAnyAssignmentDate,
    );
    if (anyDateComparison !== 0) {
      return anyDateComparison;
    }

    return a.publisher.fullName.localeCompare(b.publisher.fullName);
  });
}
