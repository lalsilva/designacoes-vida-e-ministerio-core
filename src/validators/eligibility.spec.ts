import { describe, expect, it } from "vitest";
import {
  Gender,
  IMeetingPart,
  IPublisher,
  MaritalStatus,
  MeetingSection,
  Privilege,
  ValidationReasonCode,
  validateAssigneeEligibility,
  validateAssistantEligibility,
} from "../index";

const createPublisher = (overrides: Partial<IPublisher> = {}): IPublisher => ({
  id: "pub-1",
  fullName: "John Doe",
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
  id: "part-1",
  section: MeetingSection.Ministry,
  name: "Starting a Conversation",
  requiredGender: "ANY",
  minimumPrivilege: Privilege.Publisher,
  requiresAssistant: true,
  allowsFamilyAssistant: true,
  ...overrides,
});

describe("validateAssigneeEligibility", () => {
  it("should allow an active publisher for a standard ministry part", () => {
    const publisher = createPublisher();
    const part = createPart();

    expect(validateAssigneeEligibility(publisher, part)).toEqual({
      isValid: true,
    });
  });

  it("should reject an inactive student for a ministry section part", () => {
    const publisher = createPublisher({ isActiveStudent: false });
    const part = createPart({ section: MeetingSection.Ministry });

    expect(validateAssigneeEligibility(publisher, part)).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.INACTIVE_STUDENT,
    });
  });

  it("should reject when publisher gender does not match required gender", () => {
    const sister = createPublisher({ gender: Gender.Female });
    const bibleReading = createPart({
      section: MeetingSection.Treasures,
      name: "Bible Reading",
      requiredGender: Gender.Male,
      requiresAssistant: false,
    });

    expect(validateAssigneeEligibility(sister, bibleReading)).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.GENDER_MISMATCH,
    });
  });

  it("should reject when publisher privilege is below the minimum required", () => {
    const publisher = createPublisher({ privilege: Privilege.Publisher });
    const spiritualGems = createPart({
      section: MeetingSection.Treasures,
      name: "Spiritual Gems",
      requiredGender: Gender.Male,
      minimumPrivilege: Privilege.MinisterialServant,
      requiresAssistant: false,
    });

    expect(validateAssigneeEligibility(publisher, spiritualGems)).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.INSUFFICIENT_PRIVILEGE,
    });
  });

  it("should allow an Elder to handle a part with Ministerial Servant minimum privilege", () => {
    const elder = createPublisher({ privilege: Privilege.Elder });
    const spiritualGems = createPart({
      section: MeetingSection.Treasures,
      name: "Spiritual Gems",
      requiredGender: Gender.Male,
      minimumPrivilege: Privilege.MinisterialServant,
      requiresAssistant: false,
    });

    expect(validateAssigneeEligibility(elder, spiritualGems)).toEqual({
      isValid: true,
    });
  });
});

describe("validateAssistantEligibility", () => {
  it("should reject if the part does not require an assistant", () => {
    const assignee = createPublisher({ id: "pub-1" });
    const assistant = createPublisher({ id: "pub-2" });
    const talk = createPart({ name: "Talk", requiresAssistant: false });

    expect(validateAssistantEligibility(assignee, assistant, talk)).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.PART_DOES_NOT_REQUIRE_ASSISTANT,
    });
  });

  it("should reject if assignee and assistant are the same person", () => {
    const publisher = createPublisher({ id: "pub-1" });
    const part = createPart();

    expect(validateAssistantEligibility(publisher, publisher, part)).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.ASSIGNEE_CANNOT_BE_SELF_ASSISTANT,
    });
  });

  it("should allow same-gender pairing regardless of family group", () => {
    const assignee = createPublisher({ id: "pub-1", gender: Gender.Female });
    const assistant = createPublisher({ id: "pub-2", gender: Gender.Female });
    const part = createPart({ allowsFamilyAssistant: false });

    expect(validateAssistantEligibility(assignee, assistant, part)).toEqual({
      isValid: true,
    });
  });

  it("should allow opposite-gender pairing from the same family when part permits it", () => {
    const husband = createPublisher({
      id: "pub-1",
      gender: Gender.Male,
      familyGroupId: "fam-1",
    });
    const wife = createPublisher({
      id: "pub-2",
      gender: Gender.Female,
      familyGroupId: "fam-1",
    });
    const part = createPart({ allowsFamilyAssistant: true });

    expect(validateAssistantEligibility(husband, wife, part)).toEqual({
      isValid: true,
    });
  });

  it("should reject opposite-gender pairing from different families even when family is allowed", () => {
    const brother = createPublisher({
      id: "pub-1",
      gender: Gender.Male,
      familyGroupId: "fam-1",
    });
    const sister = createPublisher({
      id: "pub-2",
      gender: Gender.Female,
      familyGroupId: "fam-2",
    });
    const part = createPart({ allowsFamilyAssistant: true });

    expect(validateAssistantEligibility(brother, sister, part)).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.ASSISTANT_MUST_BE_SAME_GENDER_OR_FAMILY,
    });
  });

  it("should reject opposite-gender family pairing when part strictly requires same gender", () => {
    const husband = createPublisher({
      id: "pub-1",
      gender: Gender.Male,
      familyGroupId: "fam-1",
    });
    const wife = createPublisher({
      id: "pub-2",
      gender: Gender.Female,
      familyGroupId: "fam-1",
    });
    const followingUp = createPart({
      name: "Following Up",
      allowsFamilyAssistant: false,
    });

    expect(validateAssistantEligibility(husband, wife, followingUp)).toEqual({
      isValid: false,
      reasonCode: ValidationReasonCode.ASSISTANT_MUST_BE_SAME_GENDER,
    });
  });
});
