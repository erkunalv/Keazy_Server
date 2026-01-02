import { useState } from "react";
import { Button, CircularProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Switch, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Select, MenuItem, Chip } from "@mui/material";
import { useQueryLogs } from "../api/logs";
import { useToast } from "../providers/ToastProvider";
import { useServices } from "../api/services";

export default function QueryLogsPage() {
  const { data, isLoading, isError, refetch } = useQueryLogs();
  const { data: servicesData } = useServices();
  const toast = useToast();
  
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedLogService, setSelectedLogService] = useState(null);
  const [assignedService, setAssignedService] = useState("");
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [correctedService, setCorrectedService] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);

  if (isLoading) {
    return (
      <Stack direction="row" alignItems="center" spacing={2}>
        <CircularProgress size={24} />
        <span>Loading logs…</span>
      </Stack>
    );
  }

  if (isError) {
    return (
      <Stack direction="row" alignItems="center" spacing={2}>
        <span style={{ color: "red" }}>Failed to load logs.</span>
        <Button variant="outlined" onClick={() => refetch()}>Retry</Button>
      </Stack>
    );
  }

  const logs = data || [];

  // Handle approval toggle
  const handleApprovalToggle = async (logId, approved) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/logs/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_for_training: approved }),
      });
      if (!res.ok) throw new Error("Failed to update approval");
      toast.show(approved ? "Log approved for training" : "Log unapproved", "success");
      refetch();
    } catch (err) {
      toast.show("Failed to update log", "error");
    }
  };

  // Handle assign service
  const handleAssignService = async () => {
    if (!assignedService.trim()) {
      toast.show("Service name is required", "warning");
      return;
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/logs/${selectedLogId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_service: assignedService }),
      });
      if (!res.ok) throw new Error("Failed to assign service");
      const data = await res.json();
      toast.show(`Service "${assignedService}" assigned successfully`, "success");
      setAssignDialogOpen(false);
      setAssignedService("");
      setSelectedLogId(null);
      // Refetch data to show updates
      refetch();
    } catch (err) {
      console.error("Assign error:", err);
      toast.show("Failed to assign service", "error");
    }
  };

  const openAssignDialog = (logId) => {
    setSelectedLogId(logId);
    setAssignDialogOpen(true);
  };

  // Save correction: user marks a prediction as wrong and provides correct service
  const saveCorrection = async () => {
    if (!correctedService.trim()) {
      toast.show("Please select the correct service", "warning");
      return;
    }
    
    try {
      setCorrectionLoading(true);
      const log = data.find(l => l._id === selectedLogId);
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_id: selectedLogId,
          query_text: log.query_text,
          original_service: selectedLogService,
          corrected_service: correctedService,
          confidence: log.confidence || 0,
          timestamp: new Date()
        }),
      });
      
      if (!res.ok) throw new Error("Failed to save correction");
      toast.show(`Correction saved: ${correctedService}`, "success");
      setCorrectionDialogOpen(false);
      setCorrectedService("");
      setSelectedLogId(null);
      refetch();
    } catch (err) {
      console.error("Correction error:", err);
      toast.show("Failed to save correction", "error");
    } finally {
      setCorrectionLoading(false);
    }
  };

  // Mark prediction as correct
  const handleMarkCorrect = async (logId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/dashboard/logs/${logId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved_for_training: true }),
      });
      if (!res.ok) throw new Error("Failed to mark correct");
      toast.show("✅ Marked as correct", "success");
      refetch();
    } catch (err) {
      console.error("Mark correct error:", err);
      toast.show("Failed to mark correct", "error");
    }
  };

  // Open correction dialog
  const openCorrectionDialog = (logId, originalService) => {
    setSelectedLogId(logId);
    setSelectedLogService(originalService);
    setCorrectionDialogOpen(true);
  };

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <h2 style={{ margin: 0 }}>Query logs</h2>
        <Button variant="contained" onClick={() => refetch()}>Refresh</Button>
      </Stack>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Query</TableCell>
            <TableCell>Service</TableCell>
            <TableCell>Confidence</TableCell>
            <TableCell>Urgency</TableCell>
            <TableCell>Approved</TableCell>
            <TableCell>Created at</TableCell>
            <TableCell>Correction Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log._id}>
              <TableCell>{log.query_text || "-"}</TableCell>
              <TableCell>{log.predicted_service || log.assigned_service || "-"}</TableCell>
              <TableCell>
                {typeof log.confidence === "number" 
                  ? (log.confidence * 100).toFixed(1) + "%" 
                  : "-"}
              </TableCell>
              <TableCell>{log.urgency || "-"}</TableCell>
              <TableCell>
                <Switch
                  checked={Boolean(log.approved_for_training)}
                  onChange={(e) => handleApprovalToggle(log._id, e.target.checked)}
                />
              </TableCell>
              <TableCell>
                {log.created_at || log.timestamp
                  ? new Date(log.created_at || log.timestamp).toLocaleString()
                  : "-"}
              </TableCell>
              <TableCell>
                {log.corrected_service ? (
                  <Chip label={`Corrected to: ${log.corrected_service}`} size="small" color="warning" />
                ) : (
                  <Chip label="Original" size="small" />
                )}
              </TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5}>
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="success"
                    onClick={() => handleMarkCorrect(log._id)}
                  >
                    ✓ Correct
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="small"
                    color="error"
                    onClick={() => openCorrectionDialog(log._id, log.predicted_service || log.assigned_service)}
                  >
                    ✗ Wrong
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Assign Service Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Service</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Service Name"
            fullWidth
            variant="outlined"
            value={assignedService}
            onChange={(e) => setAssignedService(e.target.value)}
            placeholder="e.g., plumber, electrician, pharmacy, cobbler"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignService} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Correction Dialog - User marks prediction as wrong */}
      <Dialog open={correctionDialogOpen} onClose={() => setCorrectionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mark as Wrong & Correct</DialogTitle>
        <DialogContent>
          <TextField
            disabled
            fullWidth
            label="Original Service"
            value={selectedLogService || ""}
            margin="dense"
            variant="outlined"
            sx={{ mt: 2 }}
          />
          <Select
            fullWidth
            label="Correct Service"
            value={correctedService}
            onChange={(e) => setCorrectedService(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          >
            <MenuItem value="">-- Select Correct Service --</MenuItem>
            {servicesData && servicesData.map(service => (
              <MenuItem key={service._id} value={service.name}>
                {service.name}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCorrectionDialogOpen(false); setCorrectedService(""); }}>Cancel</Button>
          <Button 
            onClick={saveCorrection} 
            variant="contained" 
            color="error"
            disabled={correctionLoading}
          >
            {correctionLoading ? <CircularProgress size={20} /> : "Mark Wrong & Correct"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}