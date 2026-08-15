import tickets from "../data/tickets.json";
import Chip from "./Chip";

type Ticket = {
  key: string;
  title: string;
  status: "To Do" | "In Progress" | "Done";
  assignee: string;
};

const STATUSES: Ticket["status"][] = ["To Do", "In Progress", "Done"];

export default function Home() {
  const allTickets = tickets as Ticket[];

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>e2e ticket mirror</h1>
      {STATUSES.map((status) => {
        const ticketsInStatus = allTickets.filter((t) => t.status === status);
        return (
          <section key={status} style={{ marginBottom: "2rem" }}>
            <h2>
              {status} ({ticketsInStatus.length})
            </h2>
            {ticketsInStatus.map((ticket) => (
              <div
                key={ticket.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  padding: "0.5rem 0.75rem",
                  marginBottom: "0.5rem",
                }}
              >
                <span>{ticket.title}</span>
                <Chip assignee={ticket.assignee} />
              </div>
            ))}
          </section>
        );
      })}
    </main>
  );
}
