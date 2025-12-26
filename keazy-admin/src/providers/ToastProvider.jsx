import { createContext, useContext, useState, useCallback } from "react";
import { Snackbar, Alert } from "@mui/material";

const ToastContext = createContext({ show: () => {} });

export function ToastProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState({ message: "", severity: "info", autoHideDuration: 3000 });

  const show = useCallback((message, severity = "info", autoHideDuration = 3000) => {
    setOpts({ message, severity, autoHideDuration });
    setOpen(true);
  }, []);

  const handleClose = () => setOpen(false);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Snackbar open={open} autoHideDuration={opts.autoHideDuration} onClose={handleClose} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={handleClose} severity={opts.severity} sx={{ width: "100%" }}>
          {opts.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}