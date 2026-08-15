export type Ticket = {
  key: string;
  title: string;
  status: "To Do" | "In Progress" | "Done";
  assignee: string;
};

export type StatusBucket = {
  status: Ticket["status"];
  tickets: Ticket[];
  count: number;
};

const STATUSES: Ticket["status"][] = ["To Do", "In Progress", "Done"];

export function groupByStatus(tickets: Ticket[]): StatusBucket[] {
  return STATUSES.map((status) => {
    const ticketsInStatus = tickets.filter((t) => t.status === status);
    return {
      status,
      tickets: ticketsInStatus,
      count: ticketsInStatus.length,
    };
  });
}
