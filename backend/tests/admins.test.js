import { describe, expect, vi, it } from "vitest";
import { addAdmin } from "../routes/superAdminRoutes.js";

describe("adding a valid admin", () => {
  const mockReq = {
    body: {
      "firstName": "Iama",
      "lastName": "Newadmin",
      "email": "iama.newadmin@gmail.com",
      "role": "admin"
    }
  }

  const mockRes = {
    json: vi.fn(),
    status: vi.fn().mockReturnThis()
  }

  it("should return status 201 and return an object with firstName, lastName and email", async() => {
    await addAdmin(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      "firstName": "Iama",
      "lastName": "Newadmin",
      "email": 'iama.newadmin@gmail.com',
    })
  })
}) 

// describe("adding a duplicate admin (already a user)", () => {
//   const mockReq = {
//     body: {
//       "firstName": "Iama",
//       "lastName": "Newadmin",
//       "email": "iama.newadmin@gmail.com",
//       "role": "admin"
//     }
//   }

//   const mockRes = {
//     json: vi.fn(),
//     status: vi.fn().mockReturnThis()
//   }

//   it("should return status 409 and return an object with firstName, lastName and email", async() => {
//     await addAdmin(mockReq, mockRes);
//     expect(mockRes.status).toHaveBeenCalledWith(201);
//     expect(mockRes.json).toHaveBeenCalledWith({
//       "firstName": "Iama",
//       "lastName": "Newadmin",
//       "email": 'iama.newadmin@gmail.com',
//     })
//   })
// }) 