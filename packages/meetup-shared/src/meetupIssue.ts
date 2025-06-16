import { safeParseAsync } from 'valibot';
import { type Meetup } from './meetupType';
import {
  humanMeetupIssueValuesSchema,
  robotMeetupIssueValuesSchema,
} from './meetupForm';

export const timestampFieldTitle = '🤖 ISO Timestamp';

export function getMeetupIssueBody(meetup: Meetup) {
  return `
### Meetup title

${meetup.title}

### ${timestampFieldTitle}

${meetup.date.toISOString()}

### Street address

${meetup.location}

### Maps link for address

${meetup.locationLink}

### Organizer

${meetup.organizer}

### Organizer link

${meetup.organizerLink}

### Signup link for meetup

${meetup.signupLink}

### Description

${meetup.description}`;
}

function parseHumanMeetupIssueFormValues(meetupIssueFormValues: unknown) {
  return safeParseAsync(humanMeetupIssueValuesSchema, meetupIssueFormValues);
}

function parseRobotMeetupIssueFormValues(meetupIssueFormValues: unknown) {
  return safeParseAsync(robotMeetupIssueValuesSchema, meetupIssueFormValues);
}

export async function parseMeetupIssueBody(body: string): Promise<
  | {
      robot: false;
      result: Awaited<ReturnType<typeof parseHumanMeetupIssueFormValues>>;
    }
  | {
      robot: true;
      result: Awaited<ReturnType<typeof parseRobotMeetupIssueFormValues>>;
    }
> {
  const { date, time, timestamp, ...meetupIssueFormValues } = {
    title: getValueFromBody(body, 'Meetup title'),
    date: getValueFromBody(body, 'Date'),
    time: getValueFromBody(body, 'Time'),
    timestamp: getValueFromBody(body, timestampFieldTitle),
    location: getValueFromBody(body, 'Street address'),
    locationLink: getValueFromBody(body, 'Maps link for address'),
    organizer: getValueFromBody(body, 'Organizer'),
    organizerLink: getValueFromBody(body, 'Organizer link'),
    signupLink: getValueFromBody(body, 'Signup link for meetup'),
    description: getRestAfterTitle(body, 'Description'),
  };

  console.log('date', date);
  console.log('time', time);
  console.log('timestamp', timestamp);
  console.log('meetupIssueFormValues', meetupIssueFormValues);

  if (date && time) {
    return {
      robot: false,
      result: await parseHumanMeetupIssueFormValues({
        ...meetupIssueFormValues,
        date,
        time,
      }),
    };
  } else {
    return {
      robot: true,
      result: await parseRobotMeetupIssueFormValues({
        ...meetupIssueFormValues,
        timestamp,
      }),
    };
  }
}

function getValueFromBody(body: string, title: string) {
  const regex = new RegExp(`### ${title}\\s*\\n\\s*([\\s\\S]*?)\\s*\\n\\s*###`);
  const match = body.match(regex);

  if (match) {
    return match[1];
  }

  return null;
}

function getRestAfterTitle(body: string, title: string) {
  const regex = new RegExp(`### ${title}\\s*\\n\\s*([\\s\\S]*)`);
  const match = body.match(regex);

  if (match) {
    return match[1];
  }

  return null;
}
