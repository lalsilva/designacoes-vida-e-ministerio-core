export enum Gender {
  Male = "M",
  Female = "F",
}

export enum Privilege {
  Elder = "ELDER",
  MinisterialServant = "MINISTERIAL_SERVANT",
  Publisher = "PUBLISHER",
}

export enum MaritalStatus {
  Single = "SINGLE",
  Married = "MARRIED",
  Widowed = "WIDOWED",
  Divorced = "DIVORCED",
}

export enum MeetingSection {
  Treasures = "TREASURES",
  Ministry = "MINISTRY",
  LivingAsChristians = "LIVING_AS_CHRISTIANS",
}

export enum AssignmentStatus {
  Scheduled = "SCHEDULED",
  Confirmed = "CONFIRMED",
  Substituted = "SUBSTITUTED",
  Canceled = "CANCELED",
}

export enum CalendarEventType {
  Normal = "NORMAL",
  Assembly = "ASSEMBLY",
  Convention = "CONVENTION",
  CircuitOverseerVisit = "CIRCUIT_OVERSEER_VISIT",
  Memorial = "MEMORIAL",
  LocalHoliday = "LOCAL_HOLIDAY",
}

export interface IPublisher {
  id: string;
  fullName: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  isParent: boolean;
  isMinor: boolean;
  isBaptized: boolean;
  familyGroupId?: string;
  privilege: Privilege;
  specialAssignment?: string; // e.g., Service Overseer, Accounts Servant
  isApprovedChairman: boolean;
  isApprovedCbsConductor: boolean;
  canPray: boolean;
  canReadCbs: boolean;
  isActiveStudent: boolean;
}

export interface IMeetingPart {
  id: string;
  section: MeetingSection;
  name: string;
  requiredGender: Gender | "ANY";
  minimumPrivilege: Privilege;
  targetPrivilege?: Privilege; // e.g., MinisterialServant for Spiritual Gems
  requiresAssistant: boolean;
  allowsFamilyAssistant: boolean; // true: Starting a Conversation / Explaining Beliefs; false: Following Up / Making Disciples
}

export interface IAssignment {
  id: string;
  meetingDate: Date;
  partId: string;
  assigneeId: string;
  assistantId?: string;
  status: AssignmentStatus;
}

export interface ICalendarEvent {
  id: string;
  eventDate: Date;
  type: CalendarEventType;
  description?: string;
  responsibleName?: string; // Circuit Overseer or Memorial Speaker
  cancelsMidweekMeeting: boolean;
}
