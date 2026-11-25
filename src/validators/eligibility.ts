import {
  IMeetingPart,
  IPublisher,
  MeetingSection,
  Privilege,
  ValidationReasonCode,
  IValidationResult,
} from "../types";

/**
 * Hierarchical weight used to compare publisher privileges against part requirements.
 */
const PRIVILEGE_WEIGHT: Record<Privilege, number> = {
  [Privilege.Publisher]: 1,
  [Privilege.MinisterialServant]: 2,
  [Privilege.Elder]: 3,
};

/**
 * Validates whether a publisher meets the S-38 requirements to be the main assignee of a meeting part.
 *
 * Checks performed:
 * 1. Active student status (required for parts in the Ministry section).
 * 2. Gender restriction (e.g., Bible Reading and Talks require male students).
 * 3. Minimum privilege hierarchy (Publisher < Ministerial Servant < Elder).
 *
 * @param publisher - The publisher being evaluated for the assignment.
 * @param part - The meeting part configuration and its constraints.
 * @returns An {@link IValidationResult} indicating eligibility and an optional failure reason code.
 */
export function validateAssigneeEligibility(
  publisher: IPublisher,
  part: IMeetingPart,
): IValidationResult {
  if (!publisher.isActiveStudent && part.section === MeetingSection.Ministry) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.INACTIVE_STUDENT,
    };
  }

  if (
    part.requiredGender !== "ANY" &&
    publisher.gender !== part.requiredGender
  ) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.GENDER_MISMATCH,
    };
  }

  if (
    PRIVILEGE_WEIGHT[publisher.privilege] <
    PRIVILEGE_WEIGHT[part.minimumPrivilege]
  ) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.INSUFFICIENT_PRIVILEGE,
    };
  }

  return { isValid: true };
}

/**
 * Validates whether an assistant can be paired with a main assignee for a specific meeting part,
 * following S-38 guidelines for student demonstrations.
 *
 * Checks performed:
 * 1. Whether the part actually requires an assistant.
 * 2. Ensures the assignee and assistant are not the same person.
 * 3. Gender and family group matching:
 *    - If `part.allowsFamilyAssistant` is `true` (e.g., Starting a Conversation, Explaining Your Beliefs),
 *      the assistant must be the same gender OR belong to the same `familyGroupId`.
 *    - If `part.allowsFamilyAssistant` is `false` (e.g., Following Up, Making Disciples),
 *      the assistant must strictly be of the same gender.
 *
 * @param assignee - The main student/publisher assigned to the part.
 * @param assistant - The candidate publisher to act as the householder/assistant.
 * @param part - The meeting part configuration and its assistant rules.
 * @returns An {@link IValidationResult} indicating if the pairing is valid and an optional failure reason code.
 */
export function validateAssistantEligibility(
  assignee: IPublisher,
  assistant: IPublisher,
  part: IMeetingPart,
): IValidationResult {
  if (!part.requiresAssistant) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.PART_DOES_NOT_REQUIRE_ASSISTANT,
    };
  }

  if (assignee.id === assistant.id) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.ASSIGNEE_CANNOT_BE_SELF_ASSISTANT,
    };
  }

  const isSameGender = assignee.gender === assistant.gender;
  const isSameFamily =
    Boolean(assignee.familyGroupId) &&
    assignee.familyGroupId === assistant.familyGroupId;

  if (part.allowsFamilyAssistant) {
    if (!isSameGender && !isSameFamily) {
      return {
        isValid: false,
        reasonCode:
          ValidationReasonCode.ASSISTANT_MUST_BE_SAME_GENDER_OR_FAMILY,
      };
    }
  } else if (!isSameGender) {
    return {
      isValid: false,
      reasonCode: ValidationReasonCode.ASSISTANT_MUST_BE_SAME_GENDER,
    };
  }

  return { isValid: true };
}
