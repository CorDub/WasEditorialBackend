import { describe, expect, vi, it } from "vitest";
import { addCategory } from "../routes/adminRoutes.js";

describe("adding a valid bookstore", () => {
  const mockReq = {
    body: {
      "tipo": "Omega Premium",
      "gestionMinima": "180.25",
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 201 and return json with name", async() => {
    await addCategory(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "name": "Omega Premium",
    })
  })
})