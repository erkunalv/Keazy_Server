import { useSlots, useAddSlot, useEditSlot } from "../api/slots";
import { CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField, Switch } from "@mui/material";
import { useState } from "react";
import { useToast } from "../providers/ToastProvider";

export default function SlotsPage() {
  const { data, isLoading, isError } = useSlots();
  const addSlot = useAddSlot();
  const editSlot = useEditSlot();
  const toast = useToast();

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [available, setAvailable] = useState(true);

  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);

  if (isLoading) return <CircularProgress />;
  if (isError) return <div style={{ color: "red" }}>Failed to load slots</div>;

  const slots = data || [];

  const handleAdd = () => {
    if (!date.trim() || !time.trim()) return toast.show("Date and time are required", "warning");
    addSlot.mutate(
      { date, time, available },
      {
        onSuccess: () => toast.show("Slot added", "success"),
        onError: () => toast.show("Failed to add slot", "error"),
      }
    );
    setDate("");
    setTime("");
    setAvailable(true);
  };

  const startEdit = (slot) => {
    setEditingId(slot._id);
    setEditDate(slot.date || "");
    setEditTime(slot.time || "");
    setEditAvailable(!!slot.available);
  };

  const saveEdit = () => {
    editSlot.mutate(
      { id: editingId, date: editDate, time: editTime, available: editAvailable },
      {
        onSuccess: () => toast.show("Slot updated", "success"),
        onError: () => toast.show("Failed to update slot", "error"),
      }
    );
    setEditingId(null);
    setEditDate("");
    setEditTime("");
    setEditAvailable(true);
  };

  return (
    <div>
      <h2>Slots</h2>

      <div style={{ marginBottom: "1rem" }}>
        <TextField label="Date" value={date} onChange={(e) => setDate(e.target.value)} size="small" style={{ marginRight: 12 }} />
        <TextField label="Time" value={time} onChange={(e) => setTime(e.target.value)} size="small" style={{ marginRight: 12 }} />
        <Switch checked={available} onChange={(e) => setAvailable(e.target.checked)} />
        <Button variant="contained" onClick={handleAdd}>Add Slot</Button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Available</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {slots.map(slot => (
            <TableRow key={slot._id}>
              <TableCell>
                {editingId === slot._id ? (
                  <TextField value={editDate} onChange={(e) => setEditDate(e.target.value)} size="small" />
                ) : slot.date}
              </TableCell>
              <TableCell>
                {editingId === slot._id ? (
                  <TextField value={editTime} onChange={(e) => setEditTime(e.target.value)} size="small" />
                ) : slot.time}
              </TableCell>
              <TableCell>
                {editingId === slot._id ? (
                  <Switch checked={editAvailable} onChange={(e) => setEditAvailable(e.target.checked)} />
                ) : (slot.available ? "Yes" : "No")}
              </TableCell>
              <TableCell>
                {editingId === slot._id ? (
                  <>
                    <Button variant="contained" onClick={saveEdit} style={{ marginRight: 8 }}>Save</Button>
                    <Button variant="text" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="outlined" onClick={() => startEdit(slot)}>Edit</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}