import { describe, it, expect, vi } from "vitest";
import { getUserExtra } from "../../routes/user/getUserExtra.js";

// --- Helpers -----------------------------------------------------------

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json   = vi.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    session: { user_id: "user-123" },
    prisma: null,
    ...overrides,
  };
}

const baseUser = {
  id:               "user-123",
  isDeleted:        false,
  email:            "test@example.com",
  phone:            "5551234567",
  phonePrefix:      "+52",
  birthday:         "1990-01-01",
  font_size:        14,
  clabe:            "012345678901234567",
  name_bank_account:"John Doe",
  bank:             "BBVA",
  swift:            "BCMRMXMM",
};

// --- Tests -------------------------------------------------------------

describe("getUserExtra", () => {

  // ── Auth ─────────────────────────────────────────────────────────────

  describe("when user_id is missing from session", () => {
    it("should return 401", async () => {
      const req = mockReq({ session: {} });
      const res = mockRes();

      await getUserExtra(req, res);

      // BUG: the current implementation does `return` with no response,
      // so neither status nor json is ever called.
      // Fix: return res.status(401).json({ message: "Unauthorized" })
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });
  });

  // ── Not found ────────────────────────────────────────────────────────

  describe("when the user does not exist", () => {
    it("should return 404", async () => {
      const req = mockReq({
        prisma: {
          user: { findUnique: vi.fn().mockResolvedValue(null) },
        },
      });
      const res = mockRes();

      await getUserExtra(req, res);

      // BUG: 204 must not carry a body; use 404 instead.
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });
  });

  describe("when the user is soft-deleted", () => {
    it("should return 404", async () => {
      const req = mockReq({
        prisma: {
          user: {
            findUnique: vi.fn().mockResolvedValue({ ...baseUser, isDeleted: true }),
          },
        },
      });
      const res = mockRes();

      await getUserExtra(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });
  });

  // ── Happy path ───────────────────────────────────────────────────────

  describe("when the user exists and is active", () => {
    it("should return 200 with the expected fields", async () => {
      const req = mockReq({
        prisma: {
          user: { findUnique: vi.fn().mockResolvedValue(baseUser) },
        },
      });
      const res = mockRes();

      await getUserExtra(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        email:            baseUser.email,
        phone:            baseUser.phone,
        phonePrefix:      baseUser.phonePrefix,
        birthday:         baseUser.birthday,
        font_size:        baseUser.font_size,
        clabe:            baseUser.clabe,
        name_bank_account:baseUser.name_bank_account,
        bank:             baseUser.bank,
        swift:            baseUser.swift,
      });
    });

    it("should NOT expose sensitive internal fields (id, password, isDeleted…)", async () => {
      const req = mockReq({
        prisma: {
          user: { findUnique: vi.fn().mockResolvedValue(baseUser) },
        },
      });
      const res = mockRes();

      await getUserExtra(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload).not.toHaveProperty("id");
      expect(payload).not.toHaveProperty("isDeleted");
      expect(payload).not.toHaveProperty("password");
    });

    it("should query by the session user_id", async () => {
      const findUnique = vi.fn().mockResolvedValue(baseUser);
      const req = mockReq({ prisma: { user: { findUnique } } });
      const res = mockRes();

      await getUserExtra(req, res);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: "user-123" } });
    });

    it("should prefer req.prisma over the module-level prisma client", async () => {
      const customFindUnique = vi.fn().mockResolvedValue(baseUser);
      const req = mockReq({
        prisma: { user: { findUnique: customFindUnique } },
      });
      const res = mockRes();

      await getUserExtra(req, res);

      expect(customFindUnique).toHaveBeenCalledTimes(1);
    });
  });

  // ── Error handling ───────────────────────────────────────────────────

  describe("when the database throws", () => {
    it("should return 500", async () => {
      const req = mockReq({
        prisma: {
          user: {
            findUnique: vi.fn().mockRejectedValue(new Error("DB exploded")),
          },
        },
      });
      const res = mockRes();

      await getUserExtra(req, res);

      // BUG: the catch block only logs, never sends a response.
      // Fix: res.status(500).json({ message: "Internal server error" })
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });
  });
});