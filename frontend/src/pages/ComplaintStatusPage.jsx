import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchComplaintById } from "../api/complaintsApi";
import PageShell from "../components/PageShell";

export default function ComplaintStatusPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadComplaint() {
      try {
        const data = await fetchComplaintById(id);
        setComplaint(data);
      } catch (err) {
        setError(err.response?.data?.detail || "Unable to fetch complaint");
      }
    }

    loadComplaint();
  }, [id]);

  return (
    <PageShell title="Complaint Status">
      <div className="actions-row">
        <Link to="/submit">Submit Another</Link>
        <Link to="/admin">Go to Admin</Link>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!error && !complaint && <p>Loading complaint...</p>}

      {complaint && <pre className="json-preview">{JSON.stringify(complaint, null, 2)}</pre>}
    </PageShell>
  );
}
