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

  // Fetch ML logs
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/api/admin/ml/logs`)
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

  // Trigger retrain
  const handleRetrain = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE}/api/admin/ml/retrain`,
        { method: "POST" }
      );
      const data = await res.json();
      alert(`Retrain status: ${data.message || "Success"}`);
    } catch (err) {
      alert("Retrain failed");
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto" }}>
      <Typography variant="h4" gutterBottom>
        Prediction Logs
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleRetrain}
        style={{ marginBottom: "1rem" }}
      >
        Retrain Model
      </Button>

      {logs.length === 0 ? (
        <Typography>No logs available.</Typography>
      ) : (
        logs.map((log) => (
          <Card key={log.id} style={{ marginBottom: "1rem" }}>
            <CardContent>
              <Typography variant="h6">{log.query_text}</Typography>
              <Typography>
                Predicted: {log.predicted_service} (Confidence:{" "}
                {(log.confidence * 100).toFixed(2)}%)
              </Typography>

              <Typography
                variant="caption"
                display="block"
                style={{ marginTop: "0.5rem" }}
              >
                Created at:{" "}
                {log.timestamp
                  ? new Date(log.timestamp).toLocaleString()
                  : "—"}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
