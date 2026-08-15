import tickets from "../data/tickets.json";
import Chip from "./Chip";
import { groupByStatus, Ticket } from "../lib/group";

export default function Home() {
  const allTickets = tickets as Ticket[];
  const buckets = groupByStatus(allTickets);

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>e2e ticket mirror</h1>
      {buckets.map(({ status, tickets: ticketsInStatus, count }) => {
        return (
          <section key={status} style={{ marginBottom: "2rem" }}>
            <h2>
              {status} ({count})
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
