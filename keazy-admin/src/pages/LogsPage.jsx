import { useLogs, useApproveLog, useAssignService } from "../api/logs";
import { CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Button, Select, MenuItem } from "@mui/material";
import { useState } from "react";
import { useToast } from "../providers/ToastProvider";

export default function LogsPage() {
  const { data, isLoading, isError } = useLogs();
  const approveLog = useApproveLog();
  const assignService = useAssignService();
  const toast = useToast();

  const [assignId, setAssignId] = useState(null);
  const [serviceName, setServiceName] = useState("");
  const [showLowConfidenceOnly, setShowLowConfidenceOnly] = useState(false);

  if (isLoading) return <CircularProgress />;
  if (isError) return <div style={{ color: "red" }}>Failed to load logs</div>;

  const logs = data || [];
  const LOW_CONFIDENCE_THRESHOLD = 0.6;

  const filteredLogs = showLowConfidenceOnly
    ? logs.filter(l => l.confidence < LOW_CONFIDENCE_THRESHOLD)
    : logs;

  const handleApprove = (log, approved) => {
    approveLog.mutate(
      { id: log._id, approved_for_training: approved },
      {
        onSuccess: () => toast.show("Log updated", "success"),
        onError: () => toast.show("Failed to update log", "error"),
      }
    );
  };

  const handleAssign = () => {
    assignService.mutate(
      { id: assignId, assigned_service: serviceName },
      {
        onSuccess: () => toast.show("Service assigned", "success"),
        onError: () => toast.show("Failed to assign service", "error"),
      }
    );
    setAssignId(null);
    setServiceName("");
  };

  return (
    <div>
      <h2>Query Logs</h2>

      <Button
        variant="outlined"
        onClick={() => setShowLowConfidenceOnly(!showLowConfidenceOnly)}
        style={{ marginBottom: "1rem" }}
      >
        {showLowConfidenceOnly ? "Show All Logs" : "Show Low-Confidence Only"}
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Query</TableCell>
            <TableCell>Predicted</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Approved</TableCell>
            <TableCell>Assign Service</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredLogs.map(log => {
            const isLowConfidence = log.confidence < LOW_CONFIDENCE_THRESHOLD;
            return (
              <TableRow key={log._id} style={{ backgroundColor: isLowConfidence ? "#fff3cd" : "inherit" }}>
                <TableCell>{log.query_text}</TableCell>
                <TableCell>{log.predicted_service}</TableCell>
                <TableCell style={{ color: isLowConfidence ? "red" : "green" }}>
                  {log.confidence.toFixed(2)}
                  {isLowConfidence && " ⚠️"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color={log.approved_for_training ? "success" : "error"}
                    onClick={() => handleApprove(log, !log.approved_for_training)}
                  >
                    {log.approved_for_training ? "Approved" : "Rejected"}
                  </Button>
                </TableCell>
                <TableCell>
                  {assignId === log._id ? (
                    <>
                      <Select
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        size="small"
                        style={{ marginRight: 8 }}
                      >
                        <MenuItem value="Plumber">Plumber</MenuItem>
                        <MenuItem value="Electrician">Electrician</MenuItem>
                        <MenuItem value="Doctor">Doctor</MenuItem>
                        {/* TODO: dynamically fetch services */}
                      </Select>
                      <Button variant="contained" onClick={handleAssign}>Save</Button>
                    </>
                  ) : (
                    <Button variant="outlined" onClick={() => setAssignId(log._id)}>Assign</Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}