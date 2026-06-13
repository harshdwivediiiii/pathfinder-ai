import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "../app/api/stats/route.js";

const mocks = vi.hoisted(() => ({
  db: {
    user: {
      count: vi.fn(),
    },
    assessment: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

vi.mock("@/lib/prisma", () => ({
  db: mocks.db,
}));

describe("GET /api/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns real metrics when database has users and assessments", async () => {
    mocks.db.user.count.mockResolvedValue(50);
    mocks.db.assessment.groupBy.mockResolvedValue([
      { userId: "u1", _count: { id: 3 } },
      { userId: "u2", _count: { id: 1 } },
      { userId: "u3", _count: { id: 5 } },
    ]);
    mocks.db.assessment.aggregate.mockResolvedValue({
      _avg: { quizScore: 78.5 },
      _count: { id: 9 },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.studentsGuided).toBe("50");
    expect(data.careerMatches).toBe("6%"); // 3/50 * 100 = 6%
    expect(data.successRate).toBe("79%"); // Math.round(78.5)
    expect(data.avgRating).toBe("3.9"); // 78.5 / 20 = 3.925 → "3.9"
  });

  it("returns zero-based defaults when database is empty", async () => {
    mocks.db.user.count.mockResolvedValue(0);
    mocks.db.assessment.groupBy.mockResolvedValue([]);
    mocks.db.assessment.aggregate.mockResolvedValue({
      _avg: { quizScore: null },
      _count: { id: 0 },
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.studentsGuided).toBe("0");
    expect(data.careerMatches).toBe("0%");
    expect(data.successRate).toBe("0%");
    expect(data.avgRating).toBe("0.0");
  });

  it("formats studentsGuided with k+ suffix for 1000+ users", async () => {
    mocks.db.user.count.mockResolvedValue(2500);
    mocks.db.assessment.groupBy.mockResolvedValue([
      { userId: "u1", _count: { id: 1 } },
    ]);
    mocks.db.assessment.aggregate.mockResolvedValue({
      _avg: { quizScore: 85 },
      _count: { id: 1 },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.studentsGuided).toBe("2.5k+");
  });

  it("formats studentsGuided without decimal for round thousands", async () => {
    mocks.db.user.count.mockResolvedValue(3000);
    mocks.db.assessment.groupBy.mockResolvedValue([]);
    mocks.db.assessment.aggregate.mockResolvedValue({
      _avg: { quizScore: null },
      _count: { id: 0 },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.studentsGuided).toBe("3k+");
  });

  it("returns 0% career matches when no users have assessments", async () => {
    mocks.db.user.count.mockResolvedValue(100);
    mocks.db.assessment.groupBy.mockResolvedValue([]);
    mocks.db.assessment.aggregate.mockResolvedValue({
      _avg: { quizScore: null },
      _count: { id: 0 },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.careerMatches).toBe("0%");
  });

  it("returns 100% career matches when every user has an assessment", async () => {
    mocks.db.user.count.mockResolvedValue(5);
    mocks.db.assessment.groupBy.mockResolvedValue([
      { userId: "u1", _count: { id: 2 } },
      { userId: "u2", _count: { id: 1 } },
      { userId: "u3", _count: { id: 3 } },
      { userId: "u4", _count: { id: 1 } },
      { userId: "u5", _count: { id: 4 } },
    ]);
    mocks.db.assessment.aggregate.mockResolvedValue({
      _avg: { quizScore: 90 },
      _count: { id: 11 },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.careerMatches).toBe("100%");
  });

  it("handles single-user edge case", async () => {
    mocks.db.user.count.mockResolvedValue(1);
    mocks.db.assessment.groupBy.mockResolvedValue([
      { userId: "u1", _count: { id: 1 } },
    ]);
    mocks.db.assessment.aggregate.mockResolvedValue({
      _avg: { quizScore: 100 },
      _count: { id: 1 },
    });

    const response = await GET();
    const data = await response.json();

    expect(data.studentsGuided).toBe("1");
    expect(data.careerMatches).toBe("100%");
    expect(data.successRate).toBe("100%");
    expect(data.avgRating).toBe("5.0");
  });

  it("returns 500 when database query fails", async () => {
    mocks.db.user.count.mockRejectedValue(new Error("Connection refused"));

    const response = await GET();

    expect(response.status).toBe(500);
  });
});
