import { useState, useMemo } from "react";
import { TextField, Select, MenuItem, Button, Box, Paper, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { MLLogsTable } from "../components";

const SERVICE_OPTIONS = [
  { value: "", label: "All Services" },
  { value: "plumber", label: "Plumber" },
  { value: "electrician", label: "Electrician" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "cobbler", label: "Cobbler" },
];

const CONFIDENCE_RANGES = [
  { min: 0, max: 0.2, label: "0.0–0.2" },
  { min: 0.2, max: 0.4, label: "0.2–0.4" },
  { min: 0.4, max: 0.6, label: "0.4–0.6" },
  { min: 0.6, max: 0.8, label: "0.6–0.8" },
  { min: 0.8, max: 1.0, label: "0.8–1.0" },
];

// Confidence Heatmap Component
function ConfidenceHeatmap({ logs }) {
  const services = ["plumber", "electrician", "pharmacy", "cobbler"];

  // Build heatmap data
  const heatmapData = useMemo(() => {
    const matrix = {};

    // Initialize matrix
    CONFIDENCE_RANGES.forEach((range) => {
      matrix[range.label] = {};
      services.forEach((service) => {
        matrix[range.label][service] = 0;
      });
    });

    // Populate matrix with log counts
    logs.forEach((log) => {
      const service = log.predicted_service?.toLowerCase() || "unknown";
      const confidence = log.confidence || 0;

      const range = CONFIDENCE_RANGES.find(
        (r) => confidence >= r.min && confidence <= r.max
      );

      if (range && services.includes(service)) {
        matrix[range.label][service]++;
      }
    });

    return matrix;
  }, [logs]);

  // Find max value for color intensity
  const maxValue = useMemo(() => {
    let max = 0;
    Object.values(heatmapData).forEach((row) => {
      Object.values(row).forEach((val) => {
        if (val > max) max = val;
      });
    });
    return max || 1;
  }, [heatmapData]);

  // Get color intensity based on value
  const getColor = (value) => {
    if (value === 0) return "#f0f0f0";
    const intensity = value / maxValue;
    return `rgba(33, 150, 243, ${intensity * 0.8 + 0.2})`;
  };

  if (logs.length === 0) {
    return (
      <Paper sx={{ padding: 2, textAlign: "center" }}>
        No data available for heatmap
      </Paper>
    );
  }

  return (
    <Paper sx={{ padding: 2, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left", fontWeight: "bold" }}>
              Confidence Range
            </th>
            {services.map((service) => (
              <th
                key={service}
                style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center", fontWeight: "bold" }}
              >
                {service.charAt(0).toUpperCase() + service.slice(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CONFIDENCE_RANGES.map((range) => (
            <tr key={range.label}>
              <td style={{ border: "1px solid #ddd", padding: "8px", fontWeight: "500" }}>
                {range.label}
              </td>
              {services.map((service) => (
                <td
                  key={`${range.label}-${service}`}
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "center",
                    backgroundColor: getColor(heatmapData[range.label][service]),
                    fontWeight: "bold",
                  }}
                >
                  {heatmapData[range.label][service]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Paper>
  );
}

export default function MLLogsPage() {
  const [filters, setFilters] = useState({
    service: "",
    minConfidence: "",
    dateFrom: null,
    dateTo: null,
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [logsData, setLogsData] = useState([]); // Store logs from table

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApplyFilters = () => {
    const filterParams = {};
    if (filters.service) filterParams.service = filters.service;
    if (filters.minConfidence !== "") filterParams.min_confidence = filters.minConfidence;
    if (filters.dateFrom) filterParams.date_from = filters.dateFrom.format("YYYY-MM-DD");
    if (filters.dateTo) filterParams.date_to = filters.dateTo.format("YYYY-MM-DD");
    
    setAppliedFilters(filterParams);
  };

  const handleClearFilters = () => {
    setFilters({
      service: "",
      minConfidence: "",
      dateFrom: null,
      dateTo: null,
    });
    setAppliedFilters({});
  };

  return (
    <div style={{ padding: "24px" }}>
      {/* Filter Controls */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Paper sx={{ padding: 2, marginBottom: 3 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2, marginBottom: 2 }}>
            {/* Service Filter */}
            <Select
              value={filters.service}
              onChange={(e) => handleFilterChange("service", e.target.value)}
              displayEmpty
              fullWidth
            >
              {SERVICE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>

            {/* Min Confidence Filter */}
            <TextField
              type="number"
              label="Min Confidence"
              placeholder="0-1"
              value={filters.minConfidence}
              onChange={(e) => handleFilterChange("minConfidence", e.target.value)}
              inputProps={{ min: 0, max: 1, step: 0.01 }}
              fullWidth
            />

            {/* Date From Filter */}
            <DatePicker
              label="From Date"
              value={filters.dateFrom}
              onChange={(date) => handleFilterChange("dateFrom", date)}
              slotProps={{ textField: { fullWidth: true } }}
            />

            {/* Date To Filter */}
            <DatePicker
              label="To Date"
              value={filters.dateTo}
              onChange={(date) => handleFilterChange("dateTo", date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Box>

          {/* Filter Buttons */}
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Button variant="contained" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button variant="outlined" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Box sx={{ marginLeft: "auto" }}>
              <ToggleButtonGroup
                value={showHeatmap}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) setShowHeatmap(newValue);
                }}
              >
                <ToggleButton value={true}>Show Heatmap</ToggleButton>
                <ToggleButton value={false}>Hide Heatmap</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Paper>
      </LocalizationProvider>

      {/* ML Logs Table */}
      <MLLogsTable filters={appliedFilters} onLogsChange={setLogsData} />

      {/* Confidence Heatmap */}
      {showHeatmap && (
        <Box sx={{ marginTop: 3 }}>
          <h3>Confidence Distribution by Service</h3>
          <ConfidenceHeatmap logs={logsData} />
        </Box>
      )}
    </div>
  );
}
