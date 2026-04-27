import { describe, it, expect, vi, beforeEach } from "vitest";
import mockingoose from "mockingoose";
import mongoose from "mongoose";
import League from "../../models/League.js";
import { listLeagues, createLeague, updateLeague, getLeagueById } from "../../controllers/leagues.controller.js";

function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
}

const FAKE_USER_ID = new mongoose.Types.ObjectId().toString();

const validLeagueBody = {
    name: "Test League",
    teamCount: 2,
    budget: 100,
    scoringTypes: ["standard"],
    owners: [{ name: "Owner One" }, { name: "Owner Two" }],
};

function fakeLeagueDoc(overrides = {}) {
    return {
        _id: new mongoose.Types.ObjectId().toString(),
        name: "Test League",
        createdBy: FAKE_USER_ID,
        teamCount: 2,
        budget: 100,
        scoringTypes: ["standard"],
        owners: [
            { _id: new mongoose.Types.ObjectId().toString(), name: "Owner One" },
            { _id: new mongoose.Types.ObjectId().toString(), name: "Owner Two" },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    };
}

beforeEach(() => {
    mockingoose.resetAll();
    vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// List Leagues
// ---------------------------------------------------------------------------
describe("Leagues - List", () => {
    it("returns 200 with an array of leagues for the current user", async () => {
        const docs = [fakeLeagueDoc(), fakeLeagueDoc({ name: "Second League" })];
        mockingoose(League).toReturn(docs, "find");

        const req = { user: { _id: FAKE_USER_ID } };
        const res = mockRes();
        await listLeagues(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                leagues: expect.arrayContaining([
                    expect.objectContaining({ name: "Test League" }),
                    expect.objectContaining({ name: "Second League" }),
                ]),
            })
        );
    });

    it("returns 200 with an empty array when the user has no leagues", async () => {
        mockingoose(League).toReturn([], "find");

        const req = { user: { _id: FAKE_USER_ID } };
        const res = mockRes();
        await listLeagues(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ leagues: [] });
    });
});

// ---------------------------------------------------------------------------
// Create League
// ---------------------------------------------------------------------------
describe("Leagues - Creation", () => {
    it("returns 400 when name is missing", async () => {
        const { name, ...bodyWithoutName } = validLeagueBody;
        const req = { body: bodyWithoutName, user: { _id: FAKE_USER_ID } };
        const res = mockRes();
        await createLeague(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when owners list is empty", async () => {
        const req = {
            body: { ...validLeagueBody, owners: [] },
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();
        await createLeague(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when owner count does not match teamCount", async () => {
        const req = {
            body: { ...validLeagueBody, teamCount: 4 },
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();
        await createLeague(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 201 with the new league on success", async () => {
        mockingoose(League).toReturn(fakeLeagueDoc(), "save");

        const req = {
            body: validLeagueBody,
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();
        await createLeague(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "Test League",
                teamCount: 2,
                budget: 100,
            })
        );
    });

    it("accepts owners provided as plain strings", async () => {
        mockingoose(League).toReturn(fakeLeagueDoc(), "save");

        const req = {
            body: { ...validLeagueBody, owners: ["Owner One", "Owner Two"] },
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();
        await createLeague(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
    });
});

// ---------------------------------------------------------------------------
// Update League
// ---------------------------------------------------------------------------
describe("Leagues - Update", () => {
    it("returns 400 when no update fields are provided", async () => {
        const req = {
            params: { leagueId: new mongoose.Types.ObjectId().toString() },
            body: {},
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();

        await updateLeague(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it("returns 400 when updated owners do not match teamCount", async () => {
        mockingoose(League).toReturn(fakeLeagueDoc({ createdBy: FAKE_USER_ID }), "findOne");

        const req = {
            params: { leagueId: new mongoose.Types.ObjectId().toString() },
            body: {
                teamCount: 3,
                owners: [{ name: "Owner One" }, { name: "Owner Two" }],
            },
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();

        await updateLeague(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                error: "The number of league owners must match teamCount",
            })
        );
    });
});

// ---------------------------------------------------------------------------
// Get League by ID (Search)
// ---------------------------------------------------------------------------
describe("Leagues - Search (getLeagueById)", () => {
    it("returns 404 when the league does not exist", async () => {
        mockingoose(League).toReturn(null, "findOne");

        const req = {
            params: { leagueId: new mongoose.Types.ObjectId().toString() },
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();
        await getLeagueById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns 403 when the league belongs to a different user", async () => {
        const otherUserId = new mongoose.Types.ObjectId().toString();
        mockingoose(League).toReturn(
            fakeLeagueDoc({ createdBy: otherUserId }),
            "findOne"
        );

        const req = {
            params: { leagueId: new mongoose.Types.ObjectId().toString() },
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();
        await getLeagueById(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
    });

    it("returns 200 with the league when found and owned by the current user", async () => {
        mockingoose(League).toReturn(
            fakeLeagueDoc({ createdBy: FAKE_USER_ID }),
            "findOne"
        );

        const req = {
            params: { leagueId: new mongoose.Types.ObjectId().toString() },
            user: { _id: FAKE_USER_ID },
        };
        const res = mockRes();
        await getLeagueById(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ name: "Test League" })
        );
    });
});
