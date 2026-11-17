
const test = require("node:test");
const assert = require("node:assert/strict");
const requireAuth = require("../src/middleware/requireAuth");

test("allows authenticated users", () => {
  const req = {
    isAuthenticated: () => true
  };

  let nextCalled = false;

  const res = {
    status() {
      return this;
    },
    json() {
      assert.fail("Authenticated users should not receive an error.");
    }
  };

  requireAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test("rejects unauthenticated users with 401", () => {
  const req = {
    isAuthenticated: () => false
  };

  let statusCode;
  let responseBody;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    }
  };

  requireAuth(req, res, () => {
    assert.fail("Unauthenticated users must not proceed.");
  });

  assert.equal(statusCode, 401);
  assert.equal(responseBody.message, "Please log in first.");
});

test("rejects requests without Passport authentication", () => {
  const req = {};
  let statusCode;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    }
  };

  requireAuth(req, res, () => {
    assert.fail("Requests without authentication must not proceed.");
  });

  assert.equal(statusCode, 401);
});
