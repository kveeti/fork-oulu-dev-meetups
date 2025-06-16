import { type Meetup } from './meetupType';

export function getMeetupPullRequestContent(
  meetup: Meetup,
  issueNumber: number,
) {
  return `New meetup

Date:
${meetup.date.toISOString()}

Organizer:
[${meetup.organizer}](${meetup.organizerLink})

Location:
[${meetup.location}](${meetup.locationLink})

Closes #${issueNumber}`;
}
