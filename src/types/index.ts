/**
 * Gender classification used to enforce S-38 assignment and assistant pairing rules.
 */
export enum Gender {
  Male = "M",
  Female = "F",
}

/**
 * Spiritual privilege hierarchy within the congregation.
 */
export enum Privilege {
  Elder = "ELDER",
  MinisterialServant = "MINISTERIAL_SERVANT",
  Publisher = "PUBLISHER",
}

/**
 * Marital status of a publisher.
 */
export enum MaritalStatus {
  Single = "SINGLE",
  Married = "MARRIED",
  Widowed = "WIDOWED",
  Divorced = "DIVORCED",
}

/**
 * Main sections of the Midweek Meeting (Our Christian Life and Ministry).
 */
export enum MeetingSection {
  /** Treasures From God's Word. */
  Treasures = "TREASURES",
  /** Apply Yourself to the Field Ministry. */
  Ministry = "MINISTRY",
  /** Living as Christians. */
  LivingAsChristians = "LIVING_AS_CHRISTIANS",
}

/**
 * Lifecycle status of a scheduled assignment.
 */
export enum AssignmentStatus {
  /** Assignment has been scheduled and is awaiting confirmation. */
  Scheduled = "SCHEDULED",
  /** Publisher has confirmed availability for the assignment. */
  Confirmed = "CONFIRMED",
  /** Original publisher could not attend and was replaced by a substitute. */
  Substituted = "SUBSTITUTED",
  /** Assignment was canceled (e.g., meeting canceled due to an event). */
  Canceled = "CANCELED",
}

/**
 * Types of special calendar events that affect the midweek meeting schedule.
 */
export enum CalendarEventType {
  /** Regular midweek meeting week with no special events. */
  Normal = "NORMAL",
  /** Circuit Assembly week (cancels the midweek meeting). */
  Assembly = "ASSEMBLY",
  /** Regional Convention week (cancels the midweek meeting). */
  Convention = "CONVENTION",
  /** Circuit Overseer visit week (CBS is replaced by the Service Talk). */
  CircuitOverseerVisit = "CIRCUIT_OVERSEER_VISIT",
  /** Memorial of Christ's death (cancels the midweek meeting if held on a weekday). */
  Memorial = "MEMORIAL",
  /** Local holiday or special branch instruction affecting the meeting. */
  LocalHoliday = "LOCAL_HOLIDAY",
}

/**
 * Represents a congregation publisher and their qualifications for meeting assignments.
 */
export interface IPublisher {
  /** Unique identifier of the publisher. */
  id: string;
  /** Full name displayed on printed schedules and assignment slips. */
  fullName: string;
  /** Publisher's gender. */
  gender: Gender;
  /** Publisher's marital status. */
  maritalStatus: MaritalStatus;
  /** Indicates whether the publisher is a parent. */
  isParent: boolean;
  /** Indicates whether the publisher is a minor. */
  isMinor: boolean;
  /** Indicates whether the publisher is baptized. */
  isBaptized: boolean;
  /** Shared identifier linking members of the same family for assistant pairing rules. */
  familyGroupId?: string;
  /** Current congregation privilege level. */
  privilege: Privilege;
  /** Optional specific congregation role (e.g., Service Overseer, Accounts Servant). */
  specialAssignment?: string;
  /** Approved by the body of elders to serve as Midweek Meeting Chairman. */
  isApprovedChairman: boolean;
  /** Approved to conduct the Congregation Bible Study (CBS). */
  isApprovedCbsConductor: boolean;
  /** Approved to offer opening or closing prayers. */
  canPray: boolean;
  /** Approved to serve as reader for the Congregation Bible Study. */
  canReadCbs: boolean;
  /** Enrolled and active to receive student assignments in the Ministry section. */
  isActiveStudent: boolean;
}

/**
 * Configuration and S-38 eligibility constraints for a specific meeting part.
 */
export interface IMeetingPart {
  /** Unique identifier of the meeting part template. */
  id: string;
  /** Meeting section to which this part belongs. */
  section: MeetingSection;
  /** Official name of the part (e.g., "Spiritual Gems", "Starting a Conversation"). */
  name: string;
  /** Required gender for the main assignee, or `'ANY'` if open to both brothers and sisters. */
  requiredGender: Gender | "ANY";
  /** Minimum privilege required to handle this part. */
  minimumPrivilege: Privilege;
  /** Preferred privilege for local prioritization (e.g., Ministerial Servant for Spiritual Gems). */
  targetPrivilege?: Privilege;
  /** Indicates whether this part requires a householder/assistant. */
  requiresAssistant: boolean;
  /**
   * Indicates whether an opposite-gender family member may act as assistant.
   * `true` for parts like Starting a Conversation or Explaining Your Beliefs;
   * `false` for parts strictly requiring same-gender pairing (e.g., Following Up, Making Disciples).
   */
  allowsFamilyAssistant: boolean;
}

/**
 * Represents a scheduled assignment linking a meeting part to one or two publishers on a specific date.
 */
export interface IAssignment {
  /** Unique identifier of the assignment record. */
  id: string;
  /** Scheduled date of the midweek meeting. */
  meetingDate: Date;
  /** Reference ID of the {@link IMeetingPart}. */
  partId: string;
  /** Reference ID of the main assigned {@link IPublisher}. */
  assigneeId: string;
  /** Reference ID of the assistant {@link IPublisher}, when required by the part. */
  assistantId?: string;
  /** Current lifecycle status of the assignment. */
  status: AssignmentStatus;
}

/**
 * Represents a special calendar event that modifies or cancels the regular midweek meeting schedule.
 */
export interface ICalendarEvent {
  /** Unique identifier of the calendar event. */
  id: string;
  /** Date (or start date) of the event. */
  eventDate: Date;
  /** Category of the event. */
  type: CalendarEventType;
  /** Optional title or notes (e.g., Regional Convention theme). */
  description?: string;
  /** Name of the visiting Circuit Overseer or special event speaker (e.g., Memorial speaker). */
  responsibleName?: string;
  /** Explicitly indicates whether the midweek meeting of that week is canceled. */
  cancelsMidweekMeeting: boolean;
}

/**
 * Standardized reason codes returned when a domain validation fails.
 * Designed to be mapped to localized messages (i18n) by consuming applications.
 */
export enum ValidationReasonCode {
  /** Publisher is not marked as an active student for Ministry section parts. */
  INACTIVE_STUDENT = "INACTIVE_STUDENT",
  /** Publisher's gender does not match the gender required by the part. */
  GENDER_MISMATCH = "GENDER_MISMATCH",
  /** Publisher's privilege level is below the minimum required for the part. */
  INSUFFICIENT_PRIVILEGE = "INSUFFICIENT_PRIVILEGE",
  /** Attempted to assign an assistant to a part that does not require one. */
  PART_DOES_NOT_REQUIRE_ASSISTANT = "PART_DOES_NOT_REQUIRE_ASSISTANT",
  /** The same publisher cannot be both the main assignee and the assistant. */
  ASSIGNEE_CANNOT_BE_SELF_ASSISTANT = "ASSIGNEE_CANNOT_BE_SELF_ASSISTANT",
  /** The part strictly requires an assistant of the same gender as the assignee. */
  ASSISTANT_MUST_BE_SAME_GENDER = "ASSISTANT_MUST_BE_SAME_GENDER",
  /** The part requires an assistant of the same gender or from the same family group. */
  ASSISTANT_MUST_BE_SAME_GENDER_OR_FAMILY = "ASSISTANT_MUST_BE_SAME_GENDER_OR_FAMILY",
  /** The midweek meeting is canceled due to a special event (e.g., Assembly, Convention, midweek Memorial). */
  MEETING_CANCELED_BY_EVENT = "MEETING_CANCELED_BY_EVENT",
  /** The publisher already has another assignment (as assignee or assistant) on the same meeting date. */
  PUBLISHER_ALREADY_ASSIGNED_ON_DATE = "PUBLISHER_ALREADY_ASSIGNED_ON_DATE",
  /** The publisher was already assigned to this exact same part earlier or later in the same month. */
  PUBLISHER_REPEATED_PART_IN_MONTH = "PUBLISHER_REPEATED_PART_IN_MONTH",
}

/**
 * Result object returned by domain validation functions.
 */
export interface IValidationResult {
  /** Indicates whether the validation passed all rules. */
  isValid: boolean;
  /** Standardized error code explaining why the validation failed. Present only when `isValid` is `false`. */
  reasonCode?: ValidationReasonCode;
}
