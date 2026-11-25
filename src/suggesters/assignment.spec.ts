import { describe, expect, it } from "vitest";
import {
  AssignmentStatus,
  CalendarEventType,
  Gender,
  IAssignment,
  ICalendarEvent,
  IMeetingPart,
  IPublisher,
  MaritalStatus,
  MeetingSection,
  Privilege,
  suggestAssignees,
  suggestAssistants,
} from "../index";

const createPublisher = (overrides: Partial<IPublisher> = {}): IPublisher => ({
  id: "pub-1",
  fullName: "Publisher Default",
  gender: Gender.Male,
  maritalStatus: MaritalStatus.Married,
  isParent: false,
  isMinor: false,
  isBaptized: true,
  privilege: Privilege.Publisher,
  isApprovedChairman: false,
  isApprovedCbsConductor: false,
  canPray: true,
  canReadCbs: true,
  isActiveStudent: true,
  ...overrides,
});

const createPart = (overrides: Partial<IMeetingPart> = {}): IMeetingPart => ({
  id: "part-gems",
  section: MeetingSection.Treasures,
  name: "Spiritual Gems",
  requiredGender: Gender.Male,
  minimumPrivilege: Privilege.MinisterialServant,
  targetPrivilege: Privilege.MinisterialServant,
  requiresAssistant: false,
  allowsFamilyAssistant: false,
  ...overrides,
});

const createAssignment = (
  overrides: Partial<IAssignment> = {},
): IAssignment => ({
  id: "assign-1",
  meetingDate: new Date("2026-10-01T19:45:00.000Z"),
  partId: "part-gems",
  assigneeId: "pub-1",
  status: AssignmentStatus.Scheduled,
  ...overrides,
});

describe("suggestAssignees", () => {
  const targetDate = new Date("2026-11-12T19:45:00.000Z");

  it("should return an empty list when the meeting week is canceled by a calendar event", () => {
    const publishers = [
      createPublisher({ id: "ms-1", privilege: Privilege.MinisterialServant }),
    ];
    const part = createPart();
    const events: ICalendarEvent[] = [
      {
        id: "evt-assembly",
        eventDate: new Date("2026-11-15T09:00:00.000Z"), // Sunday of the same week
        type: CalendarEventType.Assembly,
        cancelsMidweekMeeting: true,
      },
    ];

    expect(suggestAssignees(publishers, part, targetDate, [], events)).toEqual(
      [],
    );
  });

  it("should prioritize targetPrivilege (e.g., Ministerial Servants for Spiritual Gems) over Elders", () => {
    const elderNeverDidPart = createPublisher({
      id: "elder-1",
      fullName: "Carlos Elder",
      privilege: Privilege.Elder,
    });
    const msDidPartRecently = createPublisher({
      id: "ms-1",
      fullName: "Bruno MS",
      privilege: Privilege.MinisterialServant,
    });
    const regularPublisher = createPublisher({
      id: "pub-1",
      fullName: "Andre Publisher",
      privilege: Privilege.Publisher,
    });

    const history = [
      createAssignment({
        assigneeId: "ms-1",
        partId: "part-gems",
        meetingDate: new Date("2026-10-29T19:45:00.000Z"),
      }),
    ];

    const result = suggestAssignees(
      [elderNeverDidPart, msDidPartRecently, regularPublisher],
      createPart(),
      targetDate,
      history,
    );

    expect(result.map((c) => c.publisher.id)).toEqual(["ms-1", "elder-1"]);
    expect(result[0].matchesTargetPrivilege).toBe(true);
    expect(result[1].matchesTargetPrivilege).toBe(false);
  });

  it("should rank candidates who never did the part first, then oldest assignment date first", () => {
    const msNever = createPublisher({
      id: "ms-never",
      fullName: "Zeca",
      privilege: Privilege.MinisterialServant,
    });
    const msOld = createPublisher({
      id: "ms-old",
      fullName: "Bruno",
      privilege: Privilege.MinisterialServant,
    });
    const msRecent = createPublisher({
      id: "ms-recent",
      fullName: "Andre",
      privilege: Privilege.MinisterialServant,
    });

    const history = [
      createAssignment({
        id: "a1",
        assigneeId: "ms-old",
        partId: "part-gems",
        meetingDate: new Date("2026-09-17T19:45:00.000Z"),
      }),
      createAssignment({
        id: "a2",
        assigneeId: "ms-recent",
        partId: "part-gems",
        meetingDate: new Date("2026-10-22T19:45:00.000Z"),
      }),
    ];

    const result = suggestAssignees(
      [msRecent, msOld, msNever],
      createPart(),
      targetDate,
      history,
    );

    expect(result.map((c) => c.publisher.id)).toEqual([
      "ms-never",
      "ms-old",
      "ms-recent",
    ]);
    expect(result[0].lastPartAssignmentDate).toBeNull();
    expect(result[1].lastPartAssignmentDate).toEqual(
      new Date("2026-09-17T19:45:00.000Z"),
    );
  });

  it("should use lastAnyAssignmentDate as tie-breaker when neither candidate has done the specific part", () => {
    const msBusyRecently = createPublisher({
      id: "ms-busy",
      fullName: "Andre",
      privilege: Privilege.MinisterialServant,
    });
    const msIdleLonger = createPublisher({
      id: "ms-idle",
      fullName: "Bruno",
      privilege: Privilege.MinisterialServant,
    });

    const history = [
      createAssignment({
        id: "a1",
        assigneeId: "ms-busy",
        partId: "part-prayer",
        meetingDate: new Date("2026-11-05T19:45:00.000Z"),
      }),
      createAssignment({
        id: "a2",
        assigneeId: "ms-idle",
        partId: "part-prayer",
        meetingDate: new Date("2026-09-24T19:45:00.000Z"),
      }),
    ];

    const result = suggestAssignees(
      [msBusyRecently, msIdleLonger],
      createPart(),
      targetDate,
      history,
    );

    expect(result.map((c) => c.publisher.id)).toEqual(["ms-idle", "ms-busy"]);
  });

  it("should exclude publishers with same-day or monthly part conflicts and ignore canceled history", () => {
    const msConflictSameDay = createPublisher({
      id: "ms-same-day",
      privilege: Privilege.MinisterialServant,
    });
    const msConflictMonth = createPublisher({
      id: "ms-same-month",
      privilege: Privilege.MinisterialServant,
    });
    const msAvailable = createPublisher({
      id: "ms-ok",
      privilege: Privilege.MinisterialServant,
    });

    const history = [
      createAssignment({
        id: "a1",
        assigneeId: "ms-same-day",
        partId: "part-prayer",
        meetingDate: targetDate,
      }),
      createAssignment({
        id: "a2",
        assigneeId: "ms-same-month",
        partId: "part-gems",
        meetingDate: new Date("2026-11-05T19:45:00.000Z"),
      }),
      createAssignment({
        id: "a3",
        assigneeId: "ms-ok",
        partId: "part-gems",
        meetingDate: new Date("2026-11-05T19:45:00.000Z"),
        status: AssignmentStatus.Canceled,
      }),
    ];

    const result = suggestAssignees(
      [msConflictSameDay, msConflictMonth, msAvailable],
      createPart(),
      targetDate,
      history,
    );

    expect(result.map((c) => c.publisher.id)).toEqual(["ms-ok"]);
    expect(result[0].lastPartAssignmentDate).toBeNull();
  });
});

describe("suggestAssistants", () => {
  const targetDate = new Date("2026-11-12T19:45:00.000Z");
  const startingConversation = createPart({
    id: "part-starting",
    section: MeetingSection.Ministry,
    name: "Starting a Conversation",
    requiredGender: "ANY",
    minimumPrivilege: Privilege.Publisher,
    targetPrivilege: undefined,
    requiresAssistant: true,
    allowsFamilyAssistant: true,
  });

  it("should filter by eligibility and same-day availability, ranking by longest time without assisting", () => {
    const assignee = createPublisher({
      id: "brother-1",
      fullName: "Main Brother",
      gender: Gender.Male,
      familyGroupId: "fam-1",
    });
    const wife = createPublisher({
      id: "wife-1",
      fullName: "Maria Wife",
      gender: Gender.Female,
      familyGroupId: "fam-1",
    });
    const unrelatedSister = createPublisher({
      id: "sister-2",
      fullName: "Ana Sister",
      gender: Gender.Female,
      familyGroupId: "fam-2",
    });
    const brotherBusy = createPublisher({
      id: "brother-busy",
      fullName: "Carlos Busy",
      gender: Gender.Male,
    });
    const brotherAssistedRecently = createPublisher({
      id: "brother-recent",
      fullName: "Daniel Recent",
      gender: Gender.Male,
    });

    const history = [
      createAssignment({
        id: "a1",
        assigneeId: "brother-busy",
        partId: "part-reading",
        meetingDate: targetDate,
      }),
      createAssignment({
        id: "a2",
        assigneeId: "other-pub",
        assistantId: "brother-recent",
        partId: "part-starting",
        meetingDate: new Date("2026-10-29T19:45:00.000Z"),
      }),
    ];

    const result = suggestAssistants(
      assignee,
      [assignee, wife, unrelatedSister, brotherBusy, brotherAssistedRecently],
      startingConversation,
      targetDate,
      history,
    );

    expect(result.map((c) => c.publisher.id)).toEqual([
      "wife-1",
      "brother-recent",
    ]);
    expect(result[0].isSameFamily).toBe(true);
    expect(result[0].lastAssistantAssignmentDate).toBeNull();
    expect(result[1].isSameFamily).toBe(false);
    expect(result[1].lastAssistantAssignmentDate).toEqual(
      new Date("2026-10-29T19:45:00.000Z"),
    );
  });
});
