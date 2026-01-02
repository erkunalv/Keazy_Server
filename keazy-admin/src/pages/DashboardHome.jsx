import { useEffect, useState } from "react";
import { Button, CircularProgress, Card, CardContent, Typography } from "@mui/material";
import { useRetrainHistory, useRetrainModel } from "../api/retrain";
import { useModelStatus } from "../api/model";
import { useToast } from "../providers/ToastProvider";

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);
  const retrainHistory = useRetrainHistory();
  const retrainModel = useRetrainModel();
  const modelStatus = useModelStatus();
  const toast = useToast();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE}/dashboard/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(e => setErr(e.message));
  }, []);

  const handleRetrain = () => {
    retrainModel.mutate(undefined, {
      onSuccess: (data) => {
        console.log("✅ Retrain response:", data);
        const logsUsed = data?.logs_used || "unknown";
        toast.show(`Retrained on ${logsUsed} logs`, "success");
      },
      onError: (error) => {
        console.error("❌ Retrain error:", error);
        toast.show("Retrain failed: " + error?.message, "error");
      },
    });
  };

  if (err) return <div style={{ color: "red" }}>Failed to load stats: {err}</div>;
  if (!stats) return <div>Loading stats...</div>;

  return (
    <div>
      <h2>Dashboard</h2>
      <ul>
        <li><strong>Logs:</strong> {stats.logs}</li>
        <li><strong>Services:</strong> {stats.services}</li>
        <li><strong>Slots:</strong> {stats.slots}</li>
        <li><strong>Users:</strong> {stats.users}</li>
      </ul>

      {/* Current Model Status Card */}
      <div style={{ marginTop: "1rem" }}>
        {modelStatus.isLoading ? (
          <CircularProgress />
        ) : modelStatus.isError ? (
          <div style={{ color: "red" }}>Failed to load model status</div>
        ) : (
          <Card>
            <CardContent>
              <Typography variant="h6">Current Model Status</Typography>
              {modelStatus.data?.status === "No retrain yet" ? (
                <Typography>No retrain has been performed yet.</Typography>
              ) : (
                <>
                  <Typography>Last retrain: {new Date(modelStatus.data.retrained_at).toLocaleString()}</Typography>
                  <Typography>Logs used: {modelStatus.data.logs_used}</Typography>
                  {modelStatus.data.metrics && (
                    <>
                      <Typography>Accuracy: {modelStatus.data.metrics.accuracy}</Typography>
                      <Typography>Precision: {modelStatus.data.metrics.precision}</Typography>
                      <Typography>Recall: {modelStatus.data.metrics.recall}</Typography>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <Button variant="contained" onClick={handleRetrain} disabled={retrainModel.isLoading}>
          {retrainModel.isLoading ? <CircularProgress size={20} /> : "Retrain Model"}
        </Button>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h3>Retrain History</h3>
        {retrainHistory.isLoading ? (
          <CircularProgress />
        ) : retrainHistory.isError ? (
          <div style={{ color: "red" }}>Failed to load history</div>
        ) : (
          <ul>
            {retrainHistory.data?.map(h => (
              <li key={h._id}>
                {new Date(h.retrained_at).toLocaleString()} — {h.logs_used} logs
                {h.metrics && (
                  <span>
                    {" "} | Accuracy: {h.metrics.accuracy} | Precision: {h.metrics.precision} | Recall: {h.metrics.recall}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div style={{ marginTop: "1rem" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => {
            fetch(`${import.meta.env.VITE_API_BASE}/dashboard/retrain`, {
              method: "POST",
            })
              .then((res) => res.json())
              .then((data) => toast.show(`Retrained: ${data.logs_used} logs`, "success"))
              .catch(() => toast.show("Retrain failed", "error"));
          }}
        >
          Retrain on Approved Logs
        </Button>
      </div>
    </div>
  );
}