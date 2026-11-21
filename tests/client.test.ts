import assert from "node:assert/strict";
import { test } from "node:test";
import { ApiError, config, request } from "../src/api/client.ts";
test("API requests preserve login headers/body and Bearer check-in contract", async () => {
  config.apiUrl = "https://api.example.com";
  config.apiKey = "test-key";
  const original = globalThis.fetch;
  const calls: { url: unknown; init?: RequestInit }[] = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response('{"ok":true}', { status: 200 });
  };
  try {
    await request("/user/login", {
      login: true,
      body: { username: "staff", password: "test" },
    });
    assert.equal(calls[0].url, "https://api.example.com/user/login");
    assert.equal(calls[0].init?.method, "POST");
    assert.equal(
      new Headers(calls[0].init?.headers).get("x-api-key"),
      "test-key",
    );
    assert.deepEqual(JSON.parse(calls[0].init?.body as string), {
      username: "staff",
      password: "test",
    });
    await request("/mobile/ticket/checkin/abc", { token: "staff-token" });
    assert.equal(
      new Headers(calls[1].init?.headers).get("Authorization"),
      "Bearer staff-token",
    );
    assert.equal(
      new Headers(calls[1].init?.headers).get("x-api-key"),
      "test-key",
    );
    assert.equal(calls[1].init?.body, undefined);
  } finally {
    globalThis.fetch = original;
  }
});
test("API errors preserve HTTP status and server message", async () => {
  config.apiUrl = "https://api.example.com";
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('{"msg":"Expired token"}', { status: 401 });
  try {
    await assert.rejects(
      request("/mobile/ticket/checkin/abc"),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 401 &&
        error.message === "Expired token",
    );
  } finally {
    globalThis.fetch = original;
  }
});
test("event requests use GET with authentication and no body", async () => {
  config.apiUrl = "https://api.example.com";
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(
      url,
      "https://api.example.com/events/getEventsAndOrders?portal=1&sellerId=9",
    );
    assert.equal(init?.method, "GET");
    assert.equal(
      new Headers(init?.headers).get("Authorization"),
      "Bearer staff-token",
    );
    assert.equal(init?.body, undefined);
    return new Response("[]", { status: 200 });
  };
  try {
    await request("/events/getEventsAndOrders?portal=1&sellerId=9", {
      method: "GET",
      token: "staff-token",
    });
  } finally {
    globalThis.fetch = original;
  }
});

test("check-in event mismatch preserves the 400 response and server explanation", async () => {
  config.apiUrl = "https://api.example.com";
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    assert.deepEqual(JSON.parse(init?.body as string), { eventId: 42 });
    return new Response('{"msg":"Ticket ID does not match event"}', {
      status: 400,
    });
  };
  try {
    await assert.rejects(
      request("/mobile/ticket/checkin/abc", {
        token: "staff-token",
        body: { eventId: 42 },
      }),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 400 &&
        error.message === "Ticket ID does not match event",
    );
  } finally {
    globalThis.fetch = original;
  }
});
