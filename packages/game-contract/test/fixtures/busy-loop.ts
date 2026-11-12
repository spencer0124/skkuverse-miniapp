/*
 * A FIXTURE, not a game: a page that never finishes loading, as a game stuck in
 * a synchronous loop would. It loops as soon as it loads, so reaching the loop
 * takes no input and does not depend on how fast the runner plays. Before it
 * loops it appends the id of the process it runs in to the file
 * BUSY_LOOP_PID_FILE names, so a test can check that the runner ended that
 * process.
 */
import { appendFileSync } from 'node:fs';

const file = process.env.BUSY_LOOP_PID_FILE;
if (file) appendFileSync(file, `${process.pid}\n`);
for (;;);
