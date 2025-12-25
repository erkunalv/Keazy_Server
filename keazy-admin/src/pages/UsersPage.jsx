import { useUsers, useAddUser, useToggleUserApproval, useEditUser } from "../api/users";
import { CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Switch, TextField, Button } from "@mui/material";
import { useState } from "react";
import { useToast } from "../providers/ToastProvider";

export default function UsersPage() {
  const { data, isLoading, isError } = useUsers();
  const addUser = useAddUser();
  const toggleApproval = useToggleUserApproval();
  const editUser = useEditUser();
  const toast = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editApproved, setEditApproved] = useState(false);

  if (isLoading) return <CircularProgress />;
  if (isError) return <div style={{ color: "red" }}>Failed to load users</div>;

  const users = data || [];

  const handleAdd = () => {
    if (!name.trim() || !phone.trim()) return toast.show("Name and phone are required", "warning");
    addUser.mutate(
      { name, phone, email, approved: false },
      {
        onSuccess: () => toast.show("User added", "success"),
        onError: () => toast.show("Failed to add user", "error"),
      }
    );
    setName("");
    setPhone("");
    setEmail("");
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setEditName(u.name || "");
    setEditPhone(u.phone || "");
    setEditEmail(u.email || "");
    setEditApproved(!!u.approved);
  };

  const saveEdit = () => {
    editUser.mutate(
      { id: editingId, name: editName, phone: editPhone, email: editEmail, approved: editApproved },
      {
        onSuccess: () => toast.show("User updated", "success"),
        onError: () => toast.show("Failed to update user", "error"),
      }
    );
    setEditingId(null);
    setEditName("");
    setEditPhone("");
    setEditEmail("");
    setEditApproved(false);
  };

  return (
    <div>
      <h2>Users</h2>

      <div style={{ marginBottom: "1rem" }}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} size="small" style={{ marginRight: 12 }} />
        <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} size="small" style={{ marginRight: 12 }} />
        <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} size="small" style={{ marginRight: 12 }} />
        <Button variant="contained" onClick={handleAdd}>Add User</Button>
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Approved</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(u => (
            <TableRow key={u._id}>
              <TableCell>
                {editingId === u._id ? (
                  <TextField value={editName} onChange={(e) => setEditName(e.target.value)} size="small" />
                ) : u.name}
              </TableCell>
              <TableCell>
                {editingId === u._id ? (
                  <TextField value={editPhone} onChange={(e) => setEditPhone(e.target.value)} size="small" />
                ) : u.phone}
              </TableCell>
              <TableCell>
                {editingId === u._id ? (
                  <TextField value={editEmail} onChange={(e) => setEditEmail(e.target.value)} size="small" />
                ) : u.email}
              </TableCell>
              <TableCell>
                {editingId === u._id ? (
                  <Switch checked={editApproved} onChange={(e) => setEditApproved(e.target.checked)} />
                ) : (
                  <Switch
                    checked={!!u.approved}
                    onChange={(e) =>
                      toggleApproval.mutate(
                        { id: u._id, approved: e.target.checked },
                        {
                          onSuccess: () => toast.show("Approval updated", "success"),
                          onError: () => toast.show("Failed to update approval", "error"),
                        }
                      )
                    }
                  />
                )}
              </TableCell>
              <TableCell>
                {editingId === u._id ? (
                  <>
                    <Button variant="contained" onClick={saveEdit} style={{ marginRight: 8 }}>Save</Button>
                    <Button variant="text" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="outlined" onClick={() => startEdit(u)}>Edit</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}