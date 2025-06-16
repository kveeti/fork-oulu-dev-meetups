import { isValid, parse } from 'date-fns';
import {
  type Output,
  ValiError,
  minLength,
  object,
  safeParseAsync,
  string,
  transform,
  url,
  isoTimestamp,
  merge,
} from 'valibot';
import { meetupSchema } from './meetupType';

const sharedMeetupFormFields = [
  'title',
  'description',
  'location',
  'locationLink',
  'organizer',
  'organizerLink',
  'signupLink',
] as const;

export const humanMeetupFormFields = [
  ...sharedMeetupFormFields,
  'date',
  'time',
] as const;

export const robotMeetupFormFields = [
  ...sharedMeetupFormFields,
  'timestamp',
] as const;

export type SharedMeetupFormField = (typeof sharedMeetupFormFields)[number];
type HumanMeetupFormField = (typeof humanMeetupFormFields)[number];
type RobotMeetupFormField = (typeof robotMeetupFormFields)[number];

type ExclusivelyHumanMeetupFormField = Exclude<
  HumanMeetupFormField,
  SharedMeetupFormField
>;
type ExclusivelyRobotMeetupFormField = Exclude<
  RobotMeetupFormField,
  SharedMeetupFormField
>;

const sharedMeetupIssueValuesSchema = object({
  title: string([minLength(1)]),
  description: string([minLength(1)]),
  location: string([minLength(1)]),
  locationLink: string([url()]),
  organizer: string([minLength(1)]),
  organizerLink: string([url()]),
  signupLink: string([url()]),
} satisfies Record<SharedMeetupFormField, unknown>);

export const robotMeetupIssueValuesSchema = merge([
  sharedMeetupIssueValuesSchema,
  object({
    timestamp: string([isoTimestamp()]),
  } satisfies Record<ExclusivelyRobotMeetupFormField, unknown>),
]);

export const humanMeetupIssueValuesSchema = merge([
  sharedMeetupIssueValuesSchema,
  object({
    date: transform(string([minLength(1)]), meetupFormDateSchema),
    time: transform(string([minLength(1)]), meetupFormTimeSchema),
  } satisfies Record<ExclusivelyHumanMeetupFormField, unknown>),
]);

export type RobotMeetupFormValues = Output<typeof robotMeetupIssueValuesSchema>;
export type HumanMeetupFormValues = Output<typeof humanMeetupIssueValuesSchema>;

export async function humanMeetupFormValuesToMeetup(
  meetupFormValues: HumanMeetupFormValues,
) {
  const { date, time, ...rest } = meetupFormValues;

  return safeParseAsync(meetupSchema, {
    ...rest,
    date: new Date(`${date}T${time}`).toISOString(),
  });
}

export async function robotMeetupFormValuesToMeetup(
  meetupFormValues: RobotMeetupFormValues,
) {
  const { timestamp, ...rest } = meetupFormValues;

  return safeParseAsync(meetupSchema, {
    ...rest,
    date: timestamp,
  });
}

export function meetupFormDateSchema(input: string) {
  const parsedDate = parse(input, 'yyyy-MM-dd', new Date());

  if (!isValid(parsedDate)) {
    throw new ValiError([
      {
        input,
        message: 'Invalid date (format yyyy-MM-dd)',
        origin: 'value',
        reason: 'string',
        validation: 'date',
      },
    ]);
  }

  return input;
}

export function meetupFormTimeSchema(input: string) {
  const parsedDate = parse(input, 'HH:mm', new Date());

  if (!isValid(parsedDate)) {
    throw new ValiError([
      {
        input,
        message: 'Invalid time (format HH:mm)',
        origin: 'value',
        reason: 'string',
        validation: 'time',
      },
    ]);
  }

  return input;
}

export function assertHumanMeetupFormFields(
  meetupFormValues: Record<string, unknown>,
): asserts meetupFormValues is Record<HumanMeetupFormField, string> {
  if (!meetupFormValues || typeof meetupFormValues !== 'object') {
    throw new Error('Missing values');
  }

  humanMeetupFormFields.forEach((key) => {
    if (!(key in meetupFormValues)) {
      throw new Error(`Meetup form values is missing '${key}'`);
    }
  });
}
