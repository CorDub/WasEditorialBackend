import { describe, expect, vi, it } from "vitest";
import { addCost } from "../routes/adminRoutes.js";

describe("adding a valid cost", () => {
  const mockReq = {
    body: {
      "paymentId": 1,
      "amount": "50.25",
      "note": "Costos adicionales de impresion",
      "bookId": 3
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 201 and return json with message", async() => {
    await addCost(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "message": "Cost created successfully",
    })
  })
})