import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

let app: FastifyInstance;

before(async () => {
  app = buildApp();
  await app.ready();
});

after(async () => {
  await app.close();
});

test('GET / returns service info', async () => {
  const res = await app.inject({ method: 'GET', url: '/' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.service, 'node-api-demo');
  assert.equal(body.status, 'ok');
});

test('GET /users returns the seeded users', async () => {
  const res = await app.inject({ method: 'GET', url: '/users' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.users.length, 2);
  assert.ok(body.users.some((u: { name: string }) => u.name === 'Ada Lovelace'));
});

test('GET /users/:id returns the user when found', async () => {
  const res = await app.inject({ method: 'GET', url: '/users/u_1' });
  assert.equal(res.statusCode, 200);
  const body = res.json();
  assert.equal(body.name, 'Ada Lovelace');
  assert.equal(body.email, 'ada@example.com');
});

test('GET /users/:id returns 404 when missing', async () => {
  const res = await app.inject({ method: 'GET', url: '/users/does_not_exist' });
  assert.equal(res.statusCode, 404);
  const body = res.json();
  assert.equal(body.error, 'user_not_found');
});
