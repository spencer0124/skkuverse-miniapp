export type Day = 'day1' | 'day2';

export interface Slot {
  id: string;
  day: Day;
  start: string;
  end: string;
  act: string;
  stage: 'Main stage' | 'Lawn stage';
}

export const DAYS: readonly { value: Day; label: string }[] = [
  { value: 'day1', label: 'Day 1' },
  { value: 'day2', label: 'Day 2' },
];

export const SLOTS: readonly Slot[] = [
  { id: 'choir', day: 'day1', start: '17:00', end: '17:40', act: 'Campus Choir', stage: 'Lawn stage' },
  { id: 'kites', day: 'day1', start: '18:00', end: '18:45', act: 'Paper Kites Club', stage: 'Main stage' },
  { id: 'brass', day: 'day1', start: '19:00', end: '19:50', act: 'Night Shift Brass', stage: 'Main stage' },
  { id: 'lanterns', day: 'day1', start: '20:10', end: '21:00', act: 'The Lanterns', stage: 'Main stage' },
  { id: 'duo', day: 'day2', start: '17:30', end: '18:10', act: 'Echo Park Duo', stage: 'Lawn stage' },
  { id: 'step', day: 'day2', start: '18:30', end: '19:10', act: 'Step Up Crew', stage: 'Main stage' },
  { id: 'moonrise', day: 'day2', start: '19:30', end: '20:30', act: 'DJ Moonrise', stage: 'Main stage' },
];
