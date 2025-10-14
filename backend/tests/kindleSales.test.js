import { describe, expect, test, vi, it } from "vitest";
import { getMonthlySalesBypayments } from "../routes/authorRoutes";
import { addKindleSale } from "../routes/adminRoutes";

describe("getting monthly sales by payments", async() => {
  const mockReq = {
    "session": {
      "user_id": 152
    }
  };
  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  it('should return an array of length 13', async() => {
    await getMonthlySalesBypayments(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalled();
    const responseData = mockRes.json.mock.calls[0][0];
    expect(Array.isArray(responseData)).toBe(true);
    expect(responseData.length).toBe(13);
  })
});

describe("adding valid kindle sale", async() => {
  const mockReq = {
    "body": {
      "book": "1",
      "quantityEbook": 10,
      "quantityPod": 10,
      "dateCut": "2025-08-13T00:00:00.000Z",
      "datePay": "2025-10-13T00:00:00.000Z",
      "regalias": 121.5
    }
  }

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  it("should return status 200", async() => {
    await addKindleSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  })
});

describe("adding kindle sale with missing parameters", async() => {
  const mockReq = {
    "body": {
      "quantityEbook": 10,
      "quantityPod": 10,
      "dateCut": "2025-08-13T00:00:00.000Z",
      "datePay": "2025-10-13T00:00:00.000Z",
      "regalias": 121.5
    }
  }

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  it("should return status 500", async() => {
    await addKindleSale(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(500);
  })
})