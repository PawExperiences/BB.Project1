import { describe, expect, it } from "vitest";
import { groupByStatus, Ticket } from "./group";

function ticket(overrides: Partial<Ticket> & { key: string }): Ticket {
  return {
    title: overrides.key,
    status: "To Do",
    assignee: "",
    ...overrides,
  };
}

describe("groupByStatus", () => {
  it("always returns exactly 3 buckets in the fixed order To Do, In Progress, Done", () => {
    const buckets = groupByStatus([]);
    expect(buckets.map((b) => b.status)).toEqual(["To Do", "In Progress", "Done"]);
  });

  it("returns the fixed order regardless of the order/grouping of the input", () => {
    const tickets = [
      ticket({ key: "1", status: "Done" }),
      ticket({ key: "2", status: "To Do" }),
      ticket({ key: "3", status: "In Progress" }),
      ticket({ key: "4", status: "Done" }),
    ];

    const buckets = groupByStatus(tickets);

    expect(buckets.map((b) => b.status)).toEqual(["To Do", "In Progress", "Done"]);
  });

  it("reports the correct count and tickets per bucket", () => {
    const tickets = [
      ticket({ key: "1", status: "To Do" }),
      ticket({ key: "2", status: "In Progress" }),
      ticket({ key: "3", status: "Done" }),
      ticket({ key: "4", status: "To Do" }),
    ];

    const buckets = groupByStatus(tickets);

    const toDo = buckets.find((b) => b.status === "To Do")!;
    const inProgress = buckets.find((b) => b.status === "In Progress")!;
    const done = buckets.find((b) => b.status === "Done")!;

    expect(toDo.count).toBe(2);
    expect(toDo.tickets.map((t) => t.key)).toEqual(["1", "4"]);

    expect(inProgress.count).toBe(1);
    expect(inProgress.tickets.map((t) => t.key)).toEqual(["2"]);

    expect(done.count).toBe(1);
    expect(done.tickets.map((t) => t.key)).toEqual(["3"]);
  });

  it("preserves the relative order of tickets within a bucket (stable partitioning)", () => {
    const tickets = [
      ticket({ key: "a", status: "To Do" }),
      ticket({ key: "b", status: "Done" }),
      ticket({ key: "c", status: "To Do" }),
      ticket({ key: "d", status: "Done" }),
      ticket({ key: "e", status: "To Do" }),
    ];

    const buckets = groupByStatus(tickets);
    const toDo = buckets.find((b) => b.status === "To Do")!;
    const done = buckets.find((b) => b.status === "Done")!;

    expect(toDo.tickets.map((t) => t.key)).toEqual(["a", "c", "e"]);
    expect(done.tickets.map((t) => t.key)).toEqual(["b", "d"]);
  });

  it("excludes tickets with an unrecognized status and does not throw", () => {
    const tickets = [
      ticket({ key: "1", status: "To Do" }),
      { ...ticket({ key: "2" }), status: "Blocked" } as unknown as Ticket,
      ticket({ key: "3", status: "Done" }),
    ];

    expect(() => groupByStatus(tickets)).not.toThrow();

    const buckets = groupByStatus(tickets);
    const allTickets = buckets.flatMap((b) => b.tickets);

    expect(allTickets.map((t) => t.key)).toEqual(["1", "3"]);
    expect(buckets.reduce((sum, b) => sum + b.count, 0)).toBe(2);
  });

  it("returns 3 empty buckets, each with count 0, for an empty array", () => {
    const buckets = groupByStatus([]);

    expect(buckets).toHaveLength(3);
    buckets.forEach((bucket) => {
      expect(bucket.count).toBe(0);
      expect(bucket.tickets).toEqual([]);
    });
  });
});
