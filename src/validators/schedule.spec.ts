import { describe, expect, it } from "vitest";
import {
  AssignmentStatus,
  CalendarEventType,
  IAssignment,
  ICalendarEvent,
  ValidationReasonCode,
  validateMeetingDateAvailability,
  validatePublisherScheduleConflicts,
} from "../index";

const createAssignment = (
  overrides: Partial<IAssignment> = {},
): IAssignment => ({
  id: "assign-1",
  meetingDate: new Date("2026-11-05T19:45:00.000Z"),
  partId: "part-cbs-conductor",
  assigneeId: "pub-1",
  status: AssignmentStatus.Scheduled,
  ...overrides,
});

describe("validateMeetingDateAvailability", () => {
  it("should allow a meeting date when no canceling events exist in that week", () => {
    const meetingDate = new Date("2026-11-12T19:45:00.000Z");
    const events: ICalendarEvent[] = [
      {
        id: "evt-1",
        eventDate: new Date("2026-11-22T09:00:00.000Z"), // Sunday next week
        type: CalendarEventType.Assembly,
        cancelsMidweekMeeting: true,
      },
    ];

    expect(validateMeetingDateAvailability(meetingDate, events)).toEqual({
      isValid: true,
    });
  });

  it("should reject a Thursday meeting when an Assembly occurs on the Sunday of the same week", () => {
    const thursdayMeeting = new Date("2026-11-19T19:45:00.000Z");
    const events: ICalendarEvent[] = [
      {
        id: "evt-1",
        eventDate: new Date("2026-11-22T09:00:00.000Z"), // Sunday of the same Mon-Sun week
        type: CalendarEventType.Assembly,
        cancelsMidweekMeeting: true,
      },
    ];

    expect(validateMeetingDateAvailability(thursdayMeeting, events)).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.MEETING_CANCELED_BY_EVENT,
    });
  });

  it("should allow a midweek meeting when a Circuit Overseer visit or weekend Memorial does not cancel it", () => {
    const meetingDate = new Date("2026-11-26T19:45:00.000Z");
    const events: ICalendarEvent[] = [
      {
        id: "evt-2",
        eventDate: new Date("2026-11-26T19:45:00.000Z"),
        type: CalendarEventType.CircuitOverseerVisit,
        responsibleName: "John Smith",
        cancelsMidweekMeeting: false,
      },
    ];

    expect(validateMeetingDateAvailability(meetingDate, events)).toEqual({
      isValid: true,
    });
  });
});

describe("validatePublisherScheduleConflicts", () => {
  it("should allow assignment when publisher has no conflicts on the date or part in the month", () => {
    const existing = [
      createAssignment({
        meetingDate: new Date("2026-11-05T19:45:00.000Z"),
        partId: "part-chairman",
        assigneeId: "pub-1",
      }),
    ];

    const result = validatePublisherScheduleConflicts(
      "pub-1",
      "part-cbs-conductor",
      new Date("2026-11-12T19:45:00.000Z"),
      existing,
    );

    expect(result).toEqual({ isValid: true });
  });

  it("should reject when publisher is already main assignee on the same meeting date", () => {
    const meetingDate = new Date("2026-11-05T19:45:00.000Z");
    const existing = [
      createAssignment({
        meetingDate,
        partId: "part-opening-prayer",
        assigneeId: "pub-1",
      }),
    ];

    const result = validatePublisherScheduleConflicts(
      "pub-1",
      "part-bible-reading",
      meetingDate,
      existing,
    );

    expect(result).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.PUBLISHER_ALREADY_ASSIGNED_ON_DATE,
    });
  });

  it("should reject when publisher is already acting as assistant on the same meeting date", () => {
    const meetingDate = new Date("2026-11-05T19:45:00.000Z");
    const existing = [
      createAssignment({
        meetingDate,
        partId: "part-starting-conversation",
        assigneeId: "pub-2",
        assistantId: "pub-1",
      }),
    ];

    const result = validatePublisherScheduleConflicts(
      "pub-1",
      "part-bible-reading",
      meetingDate,
      existing,
    );

    expect(result).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.PUBLISHER_ALREADY_ASSIGNED_ON_DATE,
    });
  });

  it("should reject when publisher repeats the exact same part in the same month", () => {
    const existing = [
      createAssignment({
        meetingDate: new Date("2026-11-05T19:45:00.000Z"),
        partId: "part-cbs-conductor",
        assigneeId: "pub-1",
      }),
    ];

    const result = validatePublisherScheduleConflicts(
      "pub-1",
      "part-cbs-conductor",
      new Date("2026-11-19T19:45:00.000Z"),
      existing,
    );

    expect(result).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.PUBLISHER_REPEATED_PART_IN_MONTH,
    });
  });

  it("should allow the same part in a different month", () => {
    const existing = [
      createAssignment({
        meetingDate: new Date("2026-10-29T19:45:00.000Z"),
        partId: "part-cbs-conductor",
        assigneeId: "pub-1",
      }),
    ];

    const result = validatePublisherScheduleConflicts(
      "pub-1",
      "part-cbs-conductor",
      new Date("2026-11-05T19:45:00.000Z"),
      existing,
    );

    expect(result).toEqual({ isValid: true });
  });

  it("should ignore canceled or substituted assignments when checking conflicts", () => {
    const meetingDate = new Date("2026-11-05T19:45:00.000Z");
    const existing = [
      createAssignment({
        meetingDate,
        partId: "part-cbs-conductor",
        assigneeId: "pub-1",
        status: AssignmentStatus.Substituted,
      }),
    ];

    const result = validatePublisherScheduleConflicts(
      "pub-1",
      "part-cbs-conductor",
      meetingDate,
      existing,
    );

    expect(result).toEqual({ isValid: true });
  });
});
