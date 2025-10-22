import { describe, expect, vi, it } from "vitest";
import { addBookstore } from "../routes/adminRoutes.js";

describe("adding a valid bookstore", () => {
  const mockReq = {
    body: {
      "name": "Fancy Bookstore",
      "dealPercentage": "50.25",
      "comissions": "false",
      "contactName": "Fancy George",
      "contactPhone": "0561356226",
      "contactEmail": "fancy.george@gmail.com",
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 201 and return json with name", async() => {
    await addBookstore(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "name": "Fancy Bookstore",
    })
  })
})