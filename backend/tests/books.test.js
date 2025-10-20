import { describe, expect, vi, it } from "vitest";
import { addBook } from "../routes/adminRoutes.js";

describe("adding a valid book", () => {
  const mockReq = {
    body: {
      "title": "Yep this is a new book",
      "pasta": "Blanda",
      "price": "499.99",
      "isbn": "9786075988481",
      "quantity": "1000",
      "authors": ["152", "13"],
    }
  }; 

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  };

  it("should return status 201 and return json with title", async() => {
    await addBook(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "title": "Yep this is a new book",
    })
  })
})