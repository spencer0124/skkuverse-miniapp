export const FESTIVAL = {
  name: 'ESKARA',
  year: '2026',
  subtitle: '초록의 파도', // conventions:allow-korean
} as const;

export const ARCHIVE_NOTICE = '2026년 ESKARA가 끝난 뒤 보관한 안내예요. 데모용으로 다시 만든 화면이에요.'; // conventions:allow-korean

export const MINIAPP_ID = 'eskara-2026';

export type RowAction = { kind: 'page'; url: string } | { kind: 'map'; place: string };

export interface Row {
  icon: string;
  title: string;
  description: string;
  action: RowAction;
}

const inApp = (path: string) => `https://skkuverse.com/p/m/${MINIAPP_ID}${path}`;

export const ROWS: Row[] = [
  {
    icon: '\u{1F3A4}',
    title: '라인업', // conventions:allow-korean
    description: 'STAYC, 장기하, YB 등 13팀이 이틀에 걸쳐 무대에 올라요', // conventions:allow-korean
    action: { kind: 'page', url: inApp('/eskara/lineup') },
  },
  {
    icon: '\u{1F3AB}',
    title: '입장 안내', // conventions:allow-korean
    description: '학생증과 신분증만 있으면 돼요. 개인 입장은 10월 2일 14:00부터예요', // conventions:allow-korean
    action: { kind: 'page', url: inApp('/eskara/entry') },
  },
  {
    icon: '\u{1F4FF}',
    title: '입장 팔찌 배부', // conventions:allow-korean
    description: '10월 2일 하루만 해요. 성균인 12:00~, 동문 14:00~, 외부인 17:00~', // conventions:allow-korean
    action: { kind: 'page', url: inApp('/eskara/wristband') },
  },
  {
    icon: '\u{1F393}',
    title: '행사 복지', // conventions:allow-korean
    description: '축제 양일 학부 수업은 온라인으로 바뀌어요', // conventions:allow-korean
    action: { kind: 'page', url: inApp('/eskara/welfare') },
  },
  {
    icon: '\u{1F381}',
    title: '단체 입장 혜택', // conventions:allow-korean
    description: '갤럭시 S26부터 에버랜드 자유이용권까지 현장에서 추첨해요', // conventions:allow-korean
    action: { kind: 'page', url: inApp('/eskara/benefits') },
  },
  {
    icon: '\u{1F4F7}',
    title: '포토부스', // conventions:allow-korean
    description: '학생회관과 대운동장에서 ₩4,000~', // conventions:allow-korean
    action: { kind: 'page', url: inApp('/eskara/photobooth') },
  },
  {
    icon: '\u{1F68C}',
    title: '셔틀', // conventions:allow-korean
    description: '평소 운행 시간은 앱의 교통 탭에 나와 있어요', // conventions:allow-korean
    action: { kind: 'page', url: inApp('/eskara/shuttle') },
  },
  {
    icon: '\u{1F4CD}',
    title: '외부인 팔찌 배부 위치', // conventions:allow-korean
    description: '앱의 캠퍼스 지도에서 바로 열어요', // conventions:allow-korean
    action: { kind: 'map', place: 'event:eskara-2026-wristband-guest' },
  },
];

export interface LineupAct {
  name: string;
  day: string;
}

export const LINEUP: LineupAct[] = [
  ...['Keyveatz', '거미', 'WAYF BOYS', 'YB'].map((name) => ({ name, day: '1일차' })), // conventions:allow-korean
  ...[
    '이서연 (Y:SY)', // conventions:allow-korean
    'Dragon Pony',
    '장기하', // conventions:allow-korean
    'STAYC',
    'YENA (최예나)', // conventions:allow-korean
    'ALLDAY PROJECT',
    'GRAY',
    'Loco',
    'Simon Dominic',
  ].map((name) => ({ name, day: '2일차' })), // conventions:allow-korean
];
