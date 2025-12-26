import { useState } from "react";
import {
  TextField,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

export default function UserQuery() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Query failed");
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (feedbackType) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE}/query/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_id: result.log_id, feedback: feedbackType }),
      });
      alert(`Feedback submitted: ${feedbackType}`);
    } catch (err) {
      alert("Failed to submit feedback");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto" }}>
      <Typography variant="h5" gutterBottom>
        Service Request
      </Typography>
      <TextField
        fullWidth
        label="Describe your need"
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{ marginBottom: "1rem" }}
      />
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loading || !text}
      >
        {loading ? <CircularProgress size={20} /> : "Submit"}
      </Button>

      {error && (
        <Typography color="error" style={{ marginTop: "1rem" }}>
          {error}
        </Typography>
      )}

      {result && (
        <Card style={{ marginTop: "1rem" }}>
          <CardContent>
            <Typography variant="h6">Prediction</Typography>
            <Typography>
              Service: {result.prediction.service} | Confidence:{" "}
              {result.prediction.confidence}
            </Typography>

            <Typography variant="h6" style={{ marginTop: "1rem" }}>
              Available Slots
            </Typography>
            {result.slots.length === 0 ? (
              <Typography>No slots available for this service.</Typography>
            ) : (
              <ul>
                {result.slots.map((slot) => (
                  <li key={slot._id}>
                    {slot.service_name} —{" "}
                    {new Date(slot.time).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}

            <Typography
              variant="caption"
              display="block"
              style={{ marginTop: "1rem" }}
            >
              Log ID: {result.log_id}
            </Typography>

            {/* Feedback buttons */}
            <div style={{ marginTop: "1rem" }}>
              <Button
                variant="contained"
                color="success"
                onClick={() => sendFeedback("confirm")}
                style={{ marginRight: "0.5rem" }}
              >
                Confirm
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => sendFeedback("reject")}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}