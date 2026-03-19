import { Link } from "react-router-dom";
import PageShell from "../components/PageShell";

export default function AdminPage() {
  return (
    <PageShell title="Admin Dashboard">
      <p>This is a placeholder admin dashboard.</p>
      <div className="actions-row">
        <Link to="/submit">Back to Submit</Link>
      </div>
    </PageShell>
  );
}
