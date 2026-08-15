type ChipProps = {
  assignee?: string | null;
};

export default function Chip({ assignee }: ChipProps) {
  const hasAssignee = Boolean(assignee && assignee.trim().length > 0);

  return (
    <span
      style={{
        marginLeft: "auto",
        fontSize: "0.75rem",
        backgroundColor: hasAssignee ? "#eee" : "#f5f5f5",
        color: hasAssignee ? "#111" : "#999",
        borderRadius: "999px",
        padding: "0.15rem 0.6rem",
      }}
    >
      {hasAssignee ? assignee : "Unassigned"}
    </span>
  );
}
