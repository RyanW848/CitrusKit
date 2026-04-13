import { describe, it, expect, vi, beforeEach } from "vitest";
import mockingoose from "mockingoose";
import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import { register, login, getMe } from "../../controllers/auth.controller.js";

function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

beforeEach(() => {
    mockingoose.resetAll();
    vi.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
});

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
describe("Auth - Register", () => {
    it("returns 400 when name is missing", async () => {
        const req = { body: { email: "a@b.com", password: "pass123" } };
        const res = mockRes();
        await register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.any(String) })
        );
    });

    it("returns 400 when email is missing", async () => {
        const req = { body: { name: "Alice", password: "pass123" } };
        const res = mockRes();
        await register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when password is missing", async () => {
        const req = { body: { name: "Alice", email: "a@b.com" } };
        const res = mockRes();
        await register(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 409 when a user with that email already exists", async () => {
        mockingoose(User).toReturn(
            { _id: "64a000000000000000000001", email: "a@b.com" },
            "findOne"
        );
        const req = { body: { name: "Alice", email: "a@b.com", password: "pass123" } };
        const res = mockRes();
        await register(req, res);
        expect(res.status).toHaveBeenCalledWith(409);
    });

    it("returns 201 with user and token on successful registration", async () => {
        mockingoose(User).toReturn(null, "findOne");

        const req = { body: { name: "Alice", email: "new@b.com", password: "pass123" } };
        const res = mockRes();
        await register(req, res);
        expect(res.status).toHaveBeenCalledWith(201);
        const payload = res.json.mock.calls[0][0];
        expect(payload).toHaveProperty("token");
        expect(typeof payload.token).toBe("string");
        expect(payload.user).toMatchObject({ name: "Alice", email: "new@b.com" });
    });
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
describe("Auth - Login", () => {
    it("returns 400 when email is missing", async () => {
        const req = { body: { password: "pass123" } };
        const res = mockRes();
        await login(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when password is missing", async () => {
        const req = { body: { email: "a@b.com" } };
        const res = mockRes();
        await login(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 401 when no user exists with that email", async () => {
        mockingoose(User).toReturn(null, "findOne");
        const req = { body: { email: "nobody@b.com", password: "pass123" } };
        const res = mockRes();
        await login(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 401 when password does not match", async () => {
        const passwordHash = await bcrypt.hash("correct-password", 10);
        mockingoose(User).toReturn(
            { _id: "64a000000000000000000001", email: "a@b.com", passwordHash },
            "findOne"
        );
        const req = { body: { email: "a@b.com", password: "wrong-password" } };
        const res = mockRes();
        await login(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it("returns 200 with user and token on successful login", async () => {
        const passwordHash = await bcrypt.hash("correct-password", 10);
        mockingoose(User).toReturn(
            { _id: "64a000000000000000000001", name: "Alice", email: "a@b.com", passwordHash },
            "findOne"
        );
        const req = { body: { email: "a@b.com", password: "correct-password" } };
        const res = mockRes();
        await login(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        const payload = res.json.mock.calls[0][0];
        expect(payload).toHaveProperty("token");
        expect(typeof payload.token).toBe("string");
        expect(payload.user).toMatchObject({ email: "a@b.com" });
    });
});

// ---------------------------------------------------------------------------
// Get User (getMe)
// ---------------------------------------------------------------------------
describe("Auth - Get User", () => {
    it("returns 200 with the current user from req.user", async () => {
        const req = {
            user: { _id: "64a000000000000000000001", name: "Alice", email: "a@b.com" },
        };
        const res = mockRes();
        await getMe(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                user: expect.objectContaining({ name: "Alice", email: "a@b.com" }),
            })
        );
    });
});
