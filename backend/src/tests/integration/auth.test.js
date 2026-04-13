import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app.js";
import User from "../../models/User.js";

let mongod;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    process.env.JWT_SECRET = "integration-test-secret";
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

beforeEach(async () => {
    await User.deleteMany({});
});

// ---------------------------------------------------------------------------
// Register  POST /api/auth/register
// ---------------------------------------------------------------------------
describe("POST /api/auth/register", () => {
    it("returns 400 when required fields are missing", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ email: "a@b.com" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("returns 201 and a JWT token on successful registration", async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ name: "Alice", email: "alice@b.com", password: "pass123" });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user).toMatchObject({ name: "Alice", email: "alice@b.com" });
    });

    it("returns 409 when the email is already registered", async () => {
        await request(app)
            .post("/api/auth/register")
            .send({ name: "Alice", email: "alice@b.com", password: "pass123" });

        const res = await request(app)
            .post("/api/auth/register")
            .send({ name: "Alice", email: "alice@b.com", password: "pass123" });

        expect(res.status).toBe(409);
    });
});

// ---------------------------------------------------------------------------
// Login  POST /api/auth/login
// ---------------------------------------------------------------------------
describe("POST /api/auth/login", () => {
    beforeEach(async () => {
        await request(app)
            .post("/api/auth/register")
            .send({ name: "Alice", email: "alice@b.com", password: "pass123" });
    });

    it("returns 400 when required fields are missing", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "alice@b.com" });

        expect(res.status).toBe(400);
    });

    it("returns 401 for an unrecognised email", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "nobody@b.com", password: "pass123" });

        expect(res.status).toBe(401);
    });

    it("returns 401 for a wrong password", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "alice@b.com", password: "wrong" });

        expect(res.status).toBe(401);
    });

    it("returns 200 and a JWT token on successful login", async () => {
        const res = await request(app)
            .post("/api/auth/login")
            .send({ email: "alice@b.com", password: "pass123" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body.user).toMatchObject({ email: "alice@b.com" });
    });
});

// ---------------------------------------------------------------------------
// Get User  GET /api/auth/me
// ---------------------------------------------------------------------------
describe("GET /api/auth/me", () => {
    let token;

    beforeEach(async () => {
        const res = await request(app)
            .post("/api/auth/register")
            .send({ name: "Alice", email: "alice@b.com", password: "pass123" });
        token = res.body.token;
    });

    it("returns 401 when no token is provided", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    });

    it("returns 401 for an invalid token", async () => {
        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", "Bearer not-a-real-token");

        expect(res.status).toBe(401);
    });

    it("returns 200 with the current user for a valid token", async () => {
        const res = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.user).toMatchObject({ name: "Alice", email: "alice@b.com" });
    });
});
