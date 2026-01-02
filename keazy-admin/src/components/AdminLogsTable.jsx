import { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  Box,
  Paper,
  Typography,
  Button,
} from "@mui/material";
import { getMLLogs } from "../api/logs";

export default function MLLogsTable({ filters = {}, onLogsChange = null }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format timestamp to local date/time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Format confidence to 2 decimal places
  const formatConfidence = (confidence) => {
    return typeof confidence === "number" ? confidence.toFixed(2) : "-";
  };

  // Export logs to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert("No logs to export");
      return;
    }

    // CSV headers
    const headers = ["Query Text", "Predicted Service", "Confidence", "Latency (ms)", "Timestamp"];

    // Escape CSV values (handle quotes and commas)
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    // Convert logs to CSV rows
    const rows = logs.map((log) => [
      escapeCSV(log.query_text || ""),
      escapeCSV(log.predicted_service || ""),
      formatConfidence(log.confidence),
      log.latency_ms || "",
      formatTimestamp(log.timestamp),
    ]);

    // Create CSV string
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    // Create Blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", "ml_logs.csv");
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build params object from filters
        const params = {};
        if (filters.service) params.service = filters.service;
        if (filters.min_confidence) params.min_confidence = parseFloat(filters.min_confidence);
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;

        // Fetch logs with params
        const data = await getMLLogs(params);
        setLogs(data || []);

        // Notify parent component (MLLogsPage) of logs change for heatmap
        if (onLogsChange) {
          onLogsChange(data || []);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching ML logs:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [filters, onLogsChange]);

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <Typography variant="h5">
          ML Prediction Logs
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleExportCSV}
          disabled={logs.length === 0 || loading}
        >
          Export CSV
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", padding: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ overflowX: "auto" }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Query Text</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Predicted Service</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Confidence
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>
                  Latency (ms)
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <TableRow key={index} hover>
                    <TableCell sx={{ maxWidth: 300, wordBreak: "break-word" }}>
                      {log.query_text || "-"}
                    </TableCell>
                    <TableCell>{log.predicted_service || "-"}</TableCell>
                    <TableCell align="right">{formatConfidence(log.confidence)}</TableCell>
                    <TableCell align="right">{log.latency_ms || "-"}</TableCell>
                    <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ padding: 3 }}>
                    No logs available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
