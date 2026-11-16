import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, config, request } from '../src/api/client.ts';
test('API requests preserve login headers/body and Bearer check-in contract', async () => {
  config.apiUrl = 'https://api.example.com';
  config.apiKey = 'test-key';
  const original = globalThis.fetch;
  const calls: { url: unknown; init?: RequestInit }[] = [];
  globalThis.fetch = async (url, init) => { calls.push({ url, init }); return new Response('{"ok":true}', { status: 200 }); };
  try {
    await request('/user/login', { login: true, body: { username: 'staff', password: 'test' } });
    assert.equal(calls[0].url, 'https://api.example.com/user/login');
    assert.equal(calls[0].init?.method, 'POST');
    assert.equal(new Headers(calls[0].init?.headers).get('x-api-key'), 'test-key');
    assert.deepEqual(JSON.parse(calls[0].init?.body as string), { username: 'staff', password: 'test' });
    await request('/mobile/ticket/checkin/abc', { token: 'staff-token' });
    assert.equal(new Headers(calls[1].init?.headers).get('Authorization'), 'Bearer staff-token');
    assert.equal(calls[1].init?.body, undefined);
  } finally { globalThis.fetch = original; }
});
test('API errors preserve HTTP status and server message', async () => {
  config.apiUrl = 'https://api.example.com';
  const original = globalThis.fetch;
  globalThis.fetch = async () => new Response('{"msg":"Expired token"}', { status: 401 });
  try { await assert.rejects(request('/mobile/ticket/checkin/abc'), (error: unknown) => error instanceof ApiError && error.status === 401 && error.message === 'Expired token'); }
  finally { globalThis.fetch = original; }
});
