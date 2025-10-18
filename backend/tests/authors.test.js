import { describe, expect, vi, it } from "vitest";
import { addAuthor } from "../routes/adminRoutes.js";

describe("adding a valid author", () => {
  const mockReq = {
    body: {
      "firstName": "Yesi Deeba",
      "lastName": "Amanewauthor Ureh",
      "country": "México",
      "referido": "",
      "email": "yesi.amanewauthor@gmail.com",
      "phone": "5561356226",
      "birthday": "22121988",
      "category": "1"
    }
  }

  const mockRes= {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  it("should return status 201 and return json with firstName, lastName and email", async() => {
    await addAuthor(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "firstName": "Yesi Deeba",
      "lastName": 'Amanewauthor Ureh',
      "email": "yesi.amanewauthor@gmail.com"
    })
  })
})