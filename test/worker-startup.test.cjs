'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const loadTs = require('./load-ts.cjs');

const {
  OUTPUT_TAIL_CHARS,
  appendTail,
  detectStartupFailure,
  neverStartedReason,
  stripAnsi
} = loadTs('src/main/workerStartup.ts');

test('ANSI paint is stripped before matching', () => {
  assert.equal(stripAnsi('\x1b[31mred\x1b[0m \x1b]0;title\x07plain'), 'red plain');
});

test('the tail keeps only the most recent output', () => {
  let tail = '';
  tail = appendTail(tail, 'a'.repeat(OUTPUT_TAIL_CHARS));
  tail = appendTail(tail, 'END');
  assert.equal(tail.length, OUTPUT_TAIL_CHARS);
  assert.ok(tail.endsWith('END'));
});

test('an exhausted model is named, with the CLI\'s own line (seen live: Fable credits ran out)', () => {
  const screen = '\x1b[2K\x1b[1m> ba\x1b[0m\r\n  ⎿  You\'re out of usage credits. Switch to another model, or manage usage credits at claude.ai/settings/usage?from=cc_cli_limit_message, to continue.\r\n';
  const got = detectStartupFailure(screen);
  assert.match(got, /^no usage left for its model — "/);
  assert.match(got, /out of usage credits/);
});

test('an unavailable model and a missing login are told apart', () => {
  assert.match(detectStartupFailure('There\'s an issue with the selected model (claude-x). It may not exist or you may not have access to it.'), /^its model is not available/);
  assert.match(detectStartupFailure('Invalid API key · Please run /login'), /^the CLI is not logged in/);
});

test('ordinary output is not a failure', () => {
  assert.equal(detectStartupFailure('Welcome to Claude Code\n> \n? for shortcuts'), null);
  assert.equal(detectStartupFailure(''), null);
});

test('a worker nobody woke is told apart from one whose CLI ignored the prompt', () => {
  assert.match(neverStartedReason(20, false), /nothing typed its first message into it/);
  assert.match(neverStartedReason(20, true), /the CLI did not run it/);
});
