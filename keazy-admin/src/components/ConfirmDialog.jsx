import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from "@mui/material";

export default function ConfirmDialog({ open, title = "Confirm", message, confirmText = "Delete", cancelText = "Cancel", onConfirm, onClose }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}