import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../../app.js";
import User from "../../models/User.js";
import League from "../../models/League.js";
import DraftPick from "../../models/DraftPick.js";

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
    await DraftPick.deleteMany({});

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
        expect(res.body.rosterPositions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ abbr: "C", count: 2 }),
                expect.objectContaining({ abbr: "OF", count: 5 }),
                expect.objectContaining({ abbr: "UT", count: 1 }),
            ])
        );

        // Confirm it was actually saved
        const saved = await League.findById(res.body.id);
        expect(saved).not.toBeNull();
        expect(saved.name).toBe("Test League");
        expect(saved.rosterPositions).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ abbr: "C", count: 2 }),
            ])
        );
    });

    it("accepts custom roster position rules", async () => {
        const res = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send({
                ...validLeagueBody,
                rosterPositions: [
                    { abbr: "QB", name: "Quarterback", count: 1 },
                    { abbr: "RB", name: "Running Back", count: 2 },
                ],
            });

        expect(res.status).toBe(201);
        expect(res.body.rosterPositions).toEqual([
            { abbr: "QB", name: "Quarterback", count: 1, sortOrder: 1 },
            { abbr: "RB", name: "Running Back", count: 2, sortOrder: 2 },
        ]);
    });

    it("returns 400 for duplicate roster position abbreviations", async () => {
        const res = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send({
                ...validLeagueBody,
                rosterPositions: [
                    { abbr: "OF", name: "Outfielder", count: 3 },
                    { abbr: "of", name: "Extra Outfielder", count: 1 },
                ],
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Roster position abbreviations must be unique");
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

// ---------------------------------------------------------------------------
// Draft state  GET /api/leagues/:leagueId/draft
// ---------------------------------------------------------------------------
describe("GET /api/leagues/:leagueId/draft", () => {
    let leagueId;
    let owners;

    beforeEach(async () => {
        const res = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send(validLeagueBody);
        leagueId = res.body.id;
        owners = res.body.owners;
    });

    it("returns 401 when no token is provided", async () => {
        const res = await request(app).get(`/api/leagues/${leagueId}/draft`);
        expect(res.status).toBe(401);
    });

    it("returns 200 with league owners and draft picks", async () => {
        await DraftPick.create({
            league: leagueId,
            owner: owners[0].id,
            playerName: "Shohei Ohtani",
            position: "C",
            slot: 1,
            amount: 42,
            stat: "R",
            pickNumber: 1,
        });

        const res = await request(app)
            .get(`/api/leagues/${leagueId}/draft`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.league).toMatchObject({ id: leagueId, name: "Test League" });
        expect(res.body.picks).toHaveLength(1);
        expect(res.body.owners[0]).toMatchObject({
            id: owners[0].id,
            spent: 42,
            remainingBudget: 158,
        });
        expect(res.body.owners[0].rosterSlots).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    abbr: "C",
                    pick: expect.objectContaining({ playerName: "Shohei Ohtani" }),
                }),
                expect.objectContaining({
                    abbr: "OF",
                    pick: null,
                }),
            ])
        );
    });

    it("returns 403 when the league belongs to another user", async () => {
        const bobRes = await request(app)
            .post("/api/auth/register")
            .send({ name: "Bob", email: "bob@b.com", password: "pass123" });

        const res = await request(app)
            .get(`/api/leagues/${leagueId}/draft`)
            .set("Authorization", `Bearer ${bobRes.body.token}`);

        expect(res.status).toBe(403);
    });
});

// ---------------------------------------------------------------------------
// Draft picks  POST /api/leagues/:leagueId/draft/picks
// ---------------------------------------------------------------------------
describe("POST /api/leagues/:leagueId/draft/picks", () => {
    let leagueId;
    let owners;

    beforeEach(async () => {
        const res = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send(validLeagueBody);
        leagueId = res.body.id;
        owners = res.body.owners;
    });

    it("returns 401 when no token is provided", async () => {
        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .send({ ownerId: owners[0].id, playerName: "Aaron Judge", amount: 30 });

        expect(res.status).toBe(401);
    });

    it("returns 201 and persists a draft pick", async () => {
        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: owners[0].id,
                playerName: "Aaron Judge",
                position: "OF",
                slot: 3,
                amount: 30,
                stat: "HR",
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            owner: owners[0].id,
            playerName: "Aaron Judge",
            position: "OF",
            slot: 3,
            rosterSlot: "OF-3",
            amount: 30,
            pickNumber: 1,
        });

        const saved = await DraftPick.findById(res.body.id);
        expect(saved).not.toBeNull();
        expect(saved.playerName).toBe("Aaron Judge");
        expect(saved.slot).toBe(3);
    });

    it("assigns the first open slot when only position is provided", async () => {
        await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: owners[0].id,
                playerName: "First Outfielder",
                position: "OF",
                amount: 10,
            });

        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: owners[0].id,
                playerName: "Second Outfielder",
                position: "OF",
                amount: 11,
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            position: "OF",
            slot: 2,
            rosterSlot: "OF-2",
        });
    });

    it("accepts rosterSlot as shorthand for position and slot", async () => {
        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: owners[0].id,
                playerName: "Corner Infielder",
                rosterSlot: "CI-1",
                amount: 14,
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            position: "CI",
            slot: 1,
            rosterSlot: "CI-1",
        });
    });

    it("returns 400 when the owner is not in the league", async () => {
        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: new mongoose.Types.ObjectId().toString(),
                playerName: "Aaron Judge",
                amount: 30,
            });

        expect(res.status).toBe(400);
    });

    it("returns 400 when the pick exceeds the owner budget", async () => {
        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: owners[0].id,
                playerName: "Aaron Judge",
                amount: 201,
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("Draft pick exceeds owner budget");
    });

    it("returns 409 when a player is already drafted in the league", async () => {
        await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({ ownerId: owners[0].id, playerName: "Aaron Judge", amount: 30 });

        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({ ownerId: owners[1].id, playerName: "Aaron Judge", amount: 30 });

        expect(res.status).toBe(409);
    });

    it("returns 400 when a roster position is full for the owner", async () => {
        const leagueRes = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send({
                ...validLeagueBody,
                name: "Tiny Roster League",
                rosterPositions: [{ abbr: "C", name: "Catcher", count: 1 }],
            });

        await request(app)
            .post(`/api/leagues/${leagueRes.body.id}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: leagueRes.body.owners[0].id,
                playerName: "First Catcher",
                position: "C",
                slot: 1,
                amount: 10,
            });

        const res = await request(app)
            .post(`/api/leagues/${leagueRes.body.id}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: leagueRes.body.owners[0].id,
                playerName: "Second Catcher",
                position: "C",
                slot: 1,
                amount: 10,
            });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe("C-1 is already filled");
    });

    it("returns 400 when the position is not part of the league roster rules", async () => {
        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: owners[0].id,
                playerName: "Aaron Judge",
                position: "QB",
                amount: 30,
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("position must match a league roster position");
    });

    it("returns 400 when the requested slot does not exist for that position", async () => {
        const res = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                ownerId: owners[0].id,
                playerName: "Too Many Catchers",
                position: "C",
                slot: 3,
                amount: 30,
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe("C-3 is not a valid roster slot");
    });
});

// ---------------------------------------------------------------------------
// Draft picks  DELETE /api/leagues/:leagueId/draft/picks/:pickId
// ---------------------------------------------------------------------------
describe("DELETE /api/leagues/:leagueId/draft/picks/:pickId", () => {
    let leagueId;
    let owners;
    let pickId;

    beforeEach(async () => {
        const leagueRes = await request(app)
            .post("/api/leagues")
            .set("Authorization", `Bearer ${token}`)
            .send(validLeagueBody);
        leagueId = leagueRes.body.id;
        owners = leagueRes.body.owners;

        const pickRes = await request(app)
            .post(`/api/leagues/${leagueId}/draft/picks`)
            .set("Authorization", `Bearer ${token}`)
            .send({ ownerId: owners[0].id, playerName: "Aaron Judge", amount: 30 });
        pickId = pickRes.body.id;
    });

    it("returns 404 when the pick is not in the league", async () => {
        const res = await request(app)
            .delete(`/api/leagues/${leagueId}/draft/picks/${new mongoose.Types.ObjectId()}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    it("returns 200 and deletes the pick", async () => {
        const res = await request(app)
            .delete(`/api/leagues/${leagueId}/draft/picks/${pickId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.deleted).toBe(true);

        const saved = await DraftPick.findById(pickId);
        expect(saved).toBeNull();
    });
});
