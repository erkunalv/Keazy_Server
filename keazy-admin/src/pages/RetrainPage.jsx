/**
 * RetrainPage - ML Model Retraining Interface
 * 
 * Allows admins to:
 * 1. Trigger model retraining from approved logs
 * 2. View retrain history with metrics
 * 3. Monitor retraining progress and status
 */

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useRetrainHistory, useRetrainModel } from "../api/retrain";
import { useToast } from "../providers/ToastProvider";

export default function RetrainPage() {
  const { data: history, isLoading: historyLoading, refetch: refetchHistory } = useRetrainHistory();
  const retrainMutation = useRetrainModel();
  const toast = useToast();
  
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Handle retrain trigger
  const handleRetrain = async () => {
    try {
      setConfirmOpen(false);
      toast.show("🔄 Starting model retrain...", "info");
      await retrainMutation.mutateAsync();
      toast.show("✅ Model retrained successfully!", "success");
      // Refetch history after successful retrain
      setTimeout(() => refetchHistory(), 1000);
    } catch (err) {
      console.error("Retrain error:", err);
      toast.show("❌ Retrain failed: " + err.message, "error");
    }
  };

  const isRetraining = retrainMutation.isPending;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">🤖 Model Retraining</Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={() => setConfirmOpen(true)}
          disabled={isRetraining || historyLoading}
          startIcon={isRetraining ? <CircularProgress size={20} /> : "🔄"}
        >
          {isRetraining ? "Retraining..." : "Trigger Retrain"}
        </Button>
      </Stack>

      {/* Info Card */}
      <Card sx={{ mb: 3, backgroundColor: "#e3f2fd" }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
            ℹ️ How It Works
          </Typography>
          <Typography variant="body2">
            1. Approve query logs in the Logs page (click the toggle)
            2. Add corrections if predictions are wrong
            3. Click "Trigger Retrain" to train the model on approved data
            4. View history below to see metrics and status
          </Typography>
        </CardContent>
      </Card>

      {/* Retrain History Table */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        📊 Retrain History
      </Typography>

      {historyLoading && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <CircularProgress size={24} />
          <span>Loading history...</span>
        </Stack>
      )}

      {!historyLoading && history && history.length > 0 ? (
        <Table sx={{ mb: 3 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold" }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">Sample Count</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">Logs Used</TableCell>
              <TableCell sx={{ fontWeight: "bold" }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>ML Response</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((entry, idx) => (
              <TableRow key={entry._id || idx}>
                <TableCell>
                  {new Date(entry.retrained_at).toLocaleString()}
                </TableCell>
                <TableCell align="center">
                  {entry.sample_count || "-"}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${entry.logs_used || 0} logs`}
                    color="primary"
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={entry.status || "success"}
                    color={entry.status === "failed" ? "error" : "success"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {entry.ml_response ? (
                    <Chip
                      label={`Status: ${entry.ml_response.status || "ok"}`}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    "-"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        !historyLoading && (
          <Alert severity="info">
            No retrains yet. Approve logs and click "Trigger Retrain" to start.
          </Alert>
        )
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>⚠️ Confirm Retraining</DialogTitle>
        <DialogContent>
          <Typography sx={{ mt: 2 }}>
            This will trigger a model retraining using all approved logs and corrections.
          </Typography>
          <Typography sx={{ mt: 1, color: "textSecondary" }}>
            The process may take a few minutes. The model will be hot-reloaded after training completes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRetrain}
            variant="contained"
            color="primary"
            disabled={isRetraining}
          >
            {isRetraining ? <CircularProgress size={20} /> : "Confirm Retrain"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
