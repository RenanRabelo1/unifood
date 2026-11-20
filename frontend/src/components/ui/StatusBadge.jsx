export default function StatusBadge({ status }) {
  return <span className={`status s-${status}`}>{status}</span>
}
