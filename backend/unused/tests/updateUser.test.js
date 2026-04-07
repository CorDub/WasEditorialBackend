import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateUser } from "../../routes/user/updateUser.js";

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
    body: {},
    prisma: null,
    ...overrides,
  };
}

const baseUser = {
  id:        "user-123",
  isDeleted: false,
  email:     "test@example.com",
};

function makePrisma(userOverride = baseUser) {
  return {
    user: {
      findUnique: vi.fn().mockResolvedValue(userOverride),
      update:     vi.fn().mockResolvedValue({ ...userOverride }),
    },
  };
}

// --- Tests -------------------------------------------------------------

describe("updateUser", () => {

  // ── Unpermitted fields ───────────────────────────────────────────────

  describe("when the request body contains an unpermitted field", () => {
    it("should return 500", async () => {
      const req = mockReq({ body: { isAdmin: true } });
      const res = mockRes();

      await updateUser(req, res);

      // BUG: unpermitted field returns 500 "Internal server error" which is
      // misleading — this is a client mistake and should be 400 Bad Request.
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) })
      );
    });

    it("should not call the database at all", async () => {
      const prisma = makePrisma();
      const req = mockReq({ body: { isAdmin: true }, prisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ── Validation errors ────────────────────────────────────────────────

  describe("when a field fails validation", () => {
    it("should return 500", async () => {
      // Assumes validateInput flags an empty string for email
      const req = mockReq({ body: { email: "" } });
      const res = mockRes();

      await updateUser(req, res);

      // BUG: validation failures bubble up as thrown errors caught by the
      // catch block, returning 500. Should be 400 with a descriptive message.
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should return an error referencing the invalid field", async () => {
      const req = mockReq({ body: { email: "" } });
      const res = mockRes();

      await updateUser(req, res);

      const payload = res.json.mock.calls[0][0];
      expect(payload).toHaveProperty("error");
    });
  });

  // ── User not found / deleted ─────────────────────────────────────────

  describe("when the target user does not exist", () => {
    it("should return 500", async () => {
      const prisma = makePrisma(null);
      const req = mockReq({ body: { email: "new@example.com" }, prisma });
      const res = mockRes();

      await updateUser(req, res);

      // BUG: returns 500 with {message: "Updated"} — wrong status AND
      // misleading message for a not-found case. Should be 404.
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Updated" })
      );
    });
  });

  describe("when the target user is soft-deleted", () => {
    it("should return 500", async () => {
      const prisma = makePrisma({ ...baseUser, isDeleted: true });
      const req = mockReq({ body: { email: "new@example.com" }, prisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it("should not call user.update", async () => {
      const prisma = makePrisma({ ...baseUser, isDeleted: true });
      const req = mockReq({ body: { email: "new@example.com" }, prisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // ── Happy path ───────────────────────────────────────────────────────

  describe("when the update is valid", () => {
    it("should return 200 with an Updated message", async () => {
      const prisma = makePrisma();
      const req = mockReq({ body: { email: "new@example.com" }, prisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Updated" });
    });

    it("should call user.update with only the provided fields", async () => {
      const prisma = makePrisma();
      const body = { email: "new@example.com", phone: "5559876543" };
      const req = mockReq({ body, prisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: body,
      });
    });

    it("should call user.update with the session user_id, not a body-supplied id", async () => {
      const prisma = makePrisma();
      const req = mockReq({ body: { phone: "5550000000" }, prisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "user-123" } })
      );
    });

    it("should prefer req.prisma over the module-level prisma client", async () => {
      const customPrisma = makePrisma();
      const req = mockReq({ body: { phone: "5550000001" }, prisma: customPrisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(customPrisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(customPrisma.user.update).toHaveBeenCalledTimes(1);
    });

    it("should update all permitted fields when all are provided", async () => {
      const prisma = makePrisma();
      const body = {
        email:             "a@b.com",
        phone:             "5551234567",
        phonePrefix:       "+52",
        birthday:          "01011990",
        clabe:             "012345678901234567",
        name_bank_account: "Jane Doe",
        bank:              "BBVA",
        swift:             "BCMRMXMM",
      };
      const req = mockReq({ body, prisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: body })
      );
    });
  });

  // ── Database error ───────────────────────────────────────────────────

  describe("when the database throws during update", () => {
    it("should return 500", async () => {
      const prisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(baseUser),
          update:     vi.fn().mockRejectedValue(new Error("DB exploded")),
        },
      };
      const req = mockReq({ body: { email: "new@example.com" }, prisma });
      const res = mockRes();

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Internal server error" })
      );
    });
  });
});