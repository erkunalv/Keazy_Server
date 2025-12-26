import { useEffect, useState } from "react";
import {
  CircularProgress,
  Typography,
  Card,
  CardContent,
  Button,
} from "@mui/material";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/dashboard/logs`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch logs");
        return res.json();
      })
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto" }}>
      <Typography variant="h4" gutterBottom>
        Query Logs
      </Typography>

      {logs.length === 0 ? (
        <Typography>No logs available.</Typography>
      ) : (
        logs.map((log) => (
          <Card key={log._id} style={{ marginBottom: "1rem" }}>
            <CardContent>
              <Typography variant="h6">{log.query_text}</Typography>
              <Typography>
                Predicted: {log.predicted_service} (Confidence:{" "}
                {log.confidence})
              </Typography>

              {log.assigned_service && (
                <Typography>
                  Corrected by Admin: {log.assigned_service}
                </Typography>
              )}

              {log.user_feedback && (
                <Typography>
                  User Feedback:{" "}
                  {log.user_feedback === "confirm" ? "✅ Confirmed" : "❌ Rejected"}
                </Typography>
              )}

              <Typography variant="caption" display="block" style={{ marginTop: "0.5rem" }}>
                Created at: {new Date(log.created_at).toLocaleString()}
              </Typography>

              {/* Example admin action buttons */}
              <div style={{ marginTop: "0.5rem" }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    // Example correction action
                    // You can open a dialog or dropdown here
                    alert("Assign service correction for this log");
                  }}
                >
                  Correct Service
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}