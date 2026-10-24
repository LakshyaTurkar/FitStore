import './helpers/env.js';
import test, { afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import User from '../src/models/User.js';
import ApiError from '../src/utils/ApiError.js';
import { googleVerifier } from '../src/services/googleAuthService.js';
import { signToken } from '../src/utils/token.js';

const USER_ID = '64b7f0c2a1b2c3d4e5f60718';
const cookieFor = (id = USER_ID) => `fitstore_token=${signToken(id)}`;
const fakeUser = (role) => ({ _id: USER_ID, role, toPublicJSON: () => ({ id: USER_ID, role }) });

afterEach(() => mock.restoreAll());

test('GET /health works without auth', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('protected endpoints return 401 without a session cookie', async () => {
  for (const path of ['/auth/me', '/cart', '/orders/my', '/admin/dashboard']) {
    // eslint-disable-next-line no-await-in-loop
    const res = await request(app).get(path);
    assert.equal(res.status, 401, path);
    assert.equal(res.body.success, false);
  }
});

test('a forged / tampered token is rejected', async () => {
  const res = await request(app).get('/auth/me').set('Cookie', `fitstore_token=${signToken(USER_ID)}x`);
  assert.equal(res.status, 401);
});

test('normal users get 403 on admin APIs (role read from DB)', async () => {
  mock.method(User, 'findById', async () => fakeUser('user'));
  const res = await request(app).get('/admin/dashboard').set('Cookie', cookieFor());
  assert.equal(res.status, 403);
});

test('normal users cannot create products', async () => {
  mock.method(User, 'findById', async () => fakeUser('user'));
  const res = await request(app)
    .post('/products')
    .set('Cookie', cookieFor())
    .set('X-FitStore-Client', 'web')
    .send({ name: 'Hack', role: 'admin' });
  assert.equal(res.status, 403);
});

test('a signed-in user can read their profile', async () => {
  mock.method(User, 'findById', async () => fakeUser('user'));
  const res = await request(app).get('/auth/me').set('Cookie', cookieFor());
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.role, 'user');
});

test('state-changing requests without the client header are blocked (CSRF guard)', async () => {
  const res = await request(app).post('/auth/logout');
  assert.equal(res.status, 403);
});

test('invalid Google credential is rejected with 401', async () => {
  mock.method(googleVerifier, 'verify', async () => {
    throw ApiError.unauthorized('Google sign-in could not be verified. Please try again.');
  });
  const res = await request(app).post('/auth/google').set('X-FitStore-Client', 'web').send({ credential: 'not-a-real-token' });
  assert.equal(res.status, 401);
  assert.equal(res.headers['set-cookie'], undefined, 'no session cookie must be issued');
});

test('missing Google credential is a 400 (real verifier, no network call)', async () => {
  const res = await request(app).post('/auth/google').set('X-FitStore-Client', 'web').send({});
  assert.equal(res.status, 400);
});

test('unknown routes return a JSON 404', async () => {
  const res = await request(app).get('/does-not-exist');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});
