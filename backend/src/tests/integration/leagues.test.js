import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app.js";
import User from "../../models/User.js";
import League from "../../models/League.js";

let mongod;
let token;

const validLeagueBody = {
    name: "Test League",
    teamCount: 2,
    budget: 200,
    scoringTypes: ["standard"],
    owners: [{ name: "Owner One" }, { name: "Owner Two" }],
};

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
    await League.deleteMany({});

    // Register and log in a fresh user before each test
    const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Alice", email: "alice@b.com", password: "pass123" });
    token = res.body.token;
});

// ---------------------------------------------------------------------------
// List  GET /api/leagues
// ---------------------------------------------------------------------------
describe("GET /api/leagues", () => {
    it("returns 401 when no token is provided", async () => {
        const res = await request(app).get("/api/leagues");
        expect(res.status).toBe(401);
    });

    it("returns 200 with an empty array when the user has no leagues", async () => {
        const res = await request(app)
            .get("/api/leagues")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.leagues).toEqual([]);
    });

    it("returns only the leagues that belong to the current user", async () => {
        // Create a league for Alice
        await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send(validLeagueBody);

        // Register a second user and create a league for them
        const bobRes = await request(app)
            .post("/api/auth/register")
            .send({ name: "Bob", email: "bob@b.com", password: "pass123" });
        await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${bobRes.body.token}`)
            .send({ ...validLeagueBody, name: "Bob's League" });

        // Alice should only see her own league
        const res = await request(app)
            .get("/api/leagues")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.leagues).toHaveLength(1);
        expect(res.body.leagues[0].name).toBe("Test League");
    });
});

// ---------------------------------------------------------------------------
// Create  POST /api/leagues
// ---------------------------------------------------------------------------
describe("POST /api/leagues", () => {
    it("returns 401 when no token is provided", async () => {
        const res = await request(app).post("/api/leagues").send(validLeagueBody);
        expect(res.status).toBe(401);
    });

    it("returns 400 when required fields are missing", async () => {
        const res = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Incomplete League" });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error");
    });

    it("returns 400 when owner count does not match teamCount", async () => {
        const res = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send({ ...validLeagueBody, teamCount: 4 });

        expect(res.status).toBe(400);
    });

    it("returns 201 and persists the league in the database", async () => {
        const res = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send(validLeagueBody);

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            name: "Test League",
            teamCount: 2,
            budget: 200,
        });

        // Confirm it was actually saved
        const saved = await League.findById(res.body.id);
        expect(saved).not.toBeNull();
        expect(saved.name).toBe("Test League");
    });
});

// ---------------------------------------------------------------------------
// Get by ID  GET /api/leagues/:leagueId
// ---------------------------------------------------------------------------
describe("GET /api/leagues/:leagueId", () => {
    let leagueId;

    beforeEach(async () => {
        const res = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send(validLeagueBody);
        leagueId = res.body.id;
    });

    it("returns 401 when no token is provided", async () => {
        const res = await request(app).get(`/api/leagues/${leagueId}`);
        expect(res.status).toBe(401);
    });

    it("returns 404 for a non-existent league ID", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .get(`/api/leagues/${fakeId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it("returns 403 when the league belongs to a different user", async () => {
        const bobRes = await request(app)
            .post("/api/auth/register")
            .send({ name: "Bob", email: "bob@b.com", password: "pass123" });

        const res = await request(app)
            .get(`/api/leagues/${leagueId}`)
            .set("Authorization", `Bearer ${bobRes.body.token}`);

        expect(res.status).toBe(403);
    });

    it("returns 200 with the league for the owner", async () => {
        const res = await request(app)
            .get(`/api/leagues/${leagueId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ name: "Test League", teamCount: 2 });
    });
});
