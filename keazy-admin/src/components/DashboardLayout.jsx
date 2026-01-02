import { Outlet, Link } from "react-router-dom";
import { Drawer, List, ListItem, ListItemText, AppBar, Toolbar, Typography } from "@mui/material";

const drawerWidth = 240;

export default function DashboardLayout() {
  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        <Toolbar />
        <List>
          <ListItem button component={Link} to="/">
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem button component={Link} to="/predict">
            <ListItemText primary="Predict Query" />
          </ListItem>
          <ListItem button component={Link} to="/logs">
            <ListItemText primary="Query Logs" />
          </ListItem>
          <ListItem button component={Link} to="/ml-logs">
            <ListItemText primary="ML Logs" />
          </ListItem>
          <ListItem button component={Link} to="/retrain">
            <ListItemText primary="🤖 Model Retrain" />
          </ListItem>
          <ListItem button component={Link} to="/services">
            <ListItemText primary="Services" />
          </ListItem>
          <ListItem button component={Link} to="/slots">
            <ListItemText primary="Slots" />
          </ListItem>
          <ListItem button component={Link} to="/users">
            <ListItemText primary="Users" />
          </ListItem>
        </List>
      </Drawer>

      {/* Main content */}
      <main style={{ flexGrow: 1, padding: "24px" }}>
        <AppBar position="fixed" sx={{ zIndex: 1201 }}>
          <Toolbar>
            <Typography variant="h6" noWrap>
              Keazy Admin Dashboard
            </Typography>
          </Toolbar>
        </AppBar>
        <Toolbar />
        <Outlet />
      </main>
    </div>
  );
}