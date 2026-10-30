// The folder-list env vars split on the OS list separator (like PATH). A fixed ":"
// would cut a Windows path such as "D:\Songs" at its drive letter.
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { join, delimiter } from 'node:path';
import { tmpdir } from 'node:os';
import { songRoots, presetRoots, remoteMapFiles } from '../src/paths.js';

const lists = { STUDIO_ONE_SONGS: songRoots, STUDIO_ONE_PRESETS: presetRoots, STUDIO_ONE_REMOTE_MAP: remoteMapFiles };
const saved = Object.fromEntries(Object.keys(lists).map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

for (const [name, read] of Object.entries(lists)) {
  test(`${name}: several folders are split on the OS delimiter, drive letters survive`, () => {
    const a = join(tmpdir(), 'one'); // "C:\Users\…\one" on Windows
    const b = join(tmpdir(), 'two');
    process.env[name] = [a, b].join(delimiter);
    assert.deepEqual(read(), [a, b]);
  });

  test(`${name}: a single folder stays whole; empty entries are dropped`, () => {
    const a = join(tmpdir(), 'one');
    process.env[name] = `${delimiter}${a}${delimiter}${delimiter}`;
    assert.deepEqual(read(), [a]);
  });
}

test('Windows: a single non-ASCII path with a drive letter stays whole, ";" separates folders', { skip: process.platform !== 'win32' }, () => {
  process.env.STUDIO_ONE_SONGS = 'D:\\共有\\プロジェクト';
  assert.deepEqual(songRoots(), ['D:\\共有\\プロジェクト']);
  process.env.STUDIO_ONE_SONGS = 'D:\\共有\\プロジェクト;E:\\Songs';
  assert.deepEqual(songRoots(), ['D:\\共有\\プロジェクト', 'E:\\Songs']);
});
