import { Button, CircularProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Switch } from "@mui/material";
import { useQueryLogs } from "../api/logs";

export default function QueryLogsPage() {
  const { data, isLoading, isError, refetch } = useQueryLogs();

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
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log._id}>
              <TableCell>{log.query_text}</TableCell>
              <TableCell>{log.predicted_service}</TableCell>
              <TableCell>{(log.confidence * 100).toFixed(1)}%</TableCell>
              <TableCell>{log.urgency}</TableCell>
              <TableCell>
                <Switch
                  checked={Boolean(log.approved_for_training)}
                  // TODO: wire to API later
                  onChange={() => {}}
                />
              </TableCell>
              <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}