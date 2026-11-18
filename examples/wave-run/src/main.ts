import { createFakeHost } from '@skkuverse/miniapp/testing';
import { bootDemo } from './demo';

// The fake host stands in for the app and records every message. It installs first, as the app's bootstrap would.
const host = new URLSearchParams(location.search).get('host') === 'none' ? null : createFakeHost();
host?.install();
bootDemo(host);
