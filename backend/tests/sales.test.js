import { describe, expect, vi, it } from "vitest";
import { addSale } from "../routes/adminRoutes.js";

describe("adding a valid sale", () => {
  const mockReq = {
    body: {
      "bookId": "1",
      "bookstoreId": "1",
      "quantity": "100",
      "date": new Date(2024, 11, 22).toISOString(),
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 201", async() => {
    await addSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
  })
})