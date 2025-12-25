import { useServices, useAddService, useEditService, useDeleteService } from "../api/services";
import { CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Button, TextField } from "@mui/material";
import { useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../providers/ToastProvider";

export default function ServicesPage() {
  const { data, isLoading, isError } = useServices();
  const addService = useAddService();
  const editService = useEditService();
  const deleteService = useDeleteService();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDeleteId, setToDeleteId] = useState(null);

  if (isLoading) return <CircularProgress />;
  if (isError) return <div style={{ color: "red" }}>Failed to load services</div>;

  const services = data || [];

  const handleAdd = () => {
    if (!name.trim()) return toast.show("Service name is required", "warning");
    addService.mutate(
      { name, description },
      {
        onSuccess: () => toast.show("Service added", "success"),
        onError: () => toast.show("Failed to add service", "error"),
      }
    );
    setName("");
    setDescription("");
  };

  const startEdit = (s) => {
    setEditingId(s._id);
    setEditName(s.name || "");
    setEditDescription(s.description || "");
  };

  const saveEdit = () => {
    editService.mutate(
      { id: editingId, name: editName, description: editDescription },
      {
        onSuccess: () => toast.show("Service updated", "success"),
        onError: () => toast.show("Failed to update service", "error"),
      }
    );
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const askDelete = (id) => {
    setToDeleteId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = () => {
    deleteService.mutate(
      { id: toDeleteId },
      {
        onSuccess: () => toast.show("Service deleted", "success"),
        onError: () => toast.show("Failed to delete service", "error"),
        onSettled: () => {
          setConfirmOpen(false);
          setToDeleteId(null);
        }
      }
    );
  };

  return (
    <div>
      <h2>Services</h2>

      <div style={{ marginBottom: "1rem" }}>
        <TextField label="Service Name" value={name} onChange={(e) => setName(e.target.value)} size="small" style={{ marginRight: 12 }} />
        <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} size="small" style={{ marginRight: 12 }} />
        <Button variant="contained" onClick={handleAdd}>Add Service</Button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.map(s => (
            <TableRow key={s._id}>
              <TableCell>
                {editingId === s._id ? (
                  <TextField value={editName} onChange={(e) => setEditName(e.target.value)} size="small" />
                ) : s.name}
              </TableCell>
              <TableCell>
                {editingId === s._id ? (
                  <TextField value={editDescription} onChange={(e) => setEditDescription(e.target.value)} size="small" />
                ) : s.description}
              </TableCell>
              <TableCell>
                {editingId === s._id ? (
                  <>
                    <Button variant="contained" onClick={saveEdit} style={{ marginRight: 8 }}>Save</Button>
                    <Button variant="text" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outlined" onClick={() => startEdit(s)} style={{ marginRight: 8 }}>Edit</Button>
                    <Button color="error" variant="outlined" onClick={() => askDelete(s._id)}>Delete</Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Service"
        message="This will permanently remove the service. Are you sure?"
        confirmText="Delete"
        onConfirm={confirmDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  );
}