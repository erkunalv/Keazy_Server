/**
 * @fileoverview Admin Analytics Dashboard
 * 
 * Comprehensive analytics dashboard with:
 * - Correction statistics (Pie chart)
 * - Retrain impact metrics (Line chart)
 * - Provider performance (Bar chart)
 * - Latency trends (Line chart)
 * - Filters by date range and service type
 * - Export to CSV functionality
 * 
 * @component
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';

const API_BASE_URL = 'http://localhost:3000/dashboard';

// Colors for charts
const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
const CORRECTION_COLORS = { correct: '#4caf50', wrong: '#f44336' };

/**
 * Export data to CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} filename - Name of the CSV file
 */
const exportToCSV = (data, filename = 'analytics.csv') => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes in values
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Analytics Dashboard Component
 */
export default function AnalyticsDashboard() {
  // State management
  const [correctionsData, setCorrectionsData] = useState(null);
  const [retrainData, setRetrainData] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const [providerRatingsData, setProviderRatingsData] = useState(null);
  const [latencyData, setLatencyData] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  /**
   * Fetch all analytics data
   */
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all analytics endpoints in parallel
      const [corrections, retrain, providers, latency] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/corrections`).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/retrain-impact`).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/provider-performance`).then(r => r.json()),
        fetch(`${API_BASE_URL}/analytics/latency-trends`).then(r => r.json()),
      ]);

      // Transform corrections data for pie chart
      const correctionChartData = [
        { name: 'Correct', value: corrections.correct_count, fill: CORRECTION_COLORS.correct },
        { name: 'Wrong', value: corrections.wrong_count, fill: CORRECTION_COLORS.wrong },
      ].filter(item => item.value > 0);

      setCorrectionsData({
        ...corrections,
        chartData: correctionChartData.length > 0 ? correctionChartData : [
          { name: 'No Data', value: 1, fill: '#e0e0e0' }
        ]
      });
      
      // Transform provider data for ratings chart
      const providerRatingsChartData = Array.isArray(providers)
        ? providers
          .filter(p => p.avg_rating > 0)
          .map(p => ({
            provider_name: p.provider_name,
            avg_rating: parseFloat(p.avg_rating),
            rating_count: p.rating_count || 0
          }))
          .sort((a, b) => b.avg_rating - a.avg_rating)
        : [];
      
      setRetrainData(Array.isArray(retrain) ? retrain : []);
      setProviderData(Array.isArray(providers) ? providers : []);
      setProviderRatingsData(providerRatingsChartData);
      setLatencyData(Array.isArray(latency) ? latency : []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics, dateFrom, dateTo, serviceFilter]);

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" sx={{ mb: 2, fontWeight: 'bold' }}>
          📊 Analytics Dashboard
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Real-time insights into model performance, provider metrics, and system health
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3, backgroundColor: '#fff' }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ width: 200 }}
            />
            <TextField
              label="Date To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ width: 200 }}
            />
            <TextField
              label="Service Type"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              placeholder="Filter by service..."
              size="small"
              sx={{ width: 200 }}
            />
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={fetchAnalytics}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Dashboard Grid */}
      {!loading && (
        <Grid container spacing={3}>
          {/* Card 1: Correction Statistics */}
          <Grid item xs={12} sm={6}>
            <Card>
              <CardHeader
                title="📈 Correction Statistics"
                subheader={`Total: ${correctionsData?.total_corrections || 0}`}
              />
              <CardContent>
                {correctionsData && correctionsData.chartData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={correctionsData.chartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {correctionsData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} corrections`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        Correction Rate: {correctionsData.correction_rate}%
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportToCSV(
                        [correctionsData],
                        'correction-stats.csv'
                      )}
                      sx={{ mt: 2 }}
                    >
                      Export
                    </Button>
                  </>
                ) : (
                  <Typography color="textSecondary">No correction data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Retrain Impact */}
          <Grid item xs={12} sm={6}>
            <Card>
              <CardHeader
                title="🚀 Retrain Impact"
                subheader={`Cycles: ${retrainData?.length || 0}`}
              />
              <CardContent>
                {retrainData && retrainData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={retrainData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="cycle" 
                          label={{ value: 'Retrain Cycle', position: 'insideBottomRight', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="accuracy_before" 
                          stroke="#ff7c7c" 
                          name="Before Retrain"
                          dot={{ fill: '#ff7c7c' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="accuracy_after" 
                          stroke="#82ca9d" 
                          name="After Retrain"
                          dot={{ fill: '#82ca9d' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportToCSV(retrainData, 'retrain-impact.csv')}
                      sx={{ mt: 2 }}
                    >
                      Export
                    </Button>
                  </>
                ) : (
                  <Typography color="textSecondary">No retrain history available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: Provider Performance */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="🏆 Provider Performance"
                subheader={`Active Providers: ${providerData?.length || 0}`}
              />
              <CardContent>
                {providerData && providerData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={providerData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="provider_name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis 
                          yAxisId="left"
                          label={{ value: 'Total Bookings', angle: -90, position: 'insideLeft' }}
                        />
                        <YAxis 
                          yAxisId="right" 
                          orientation="right"
                          label={{ value: 'Avg Confidence', angle: 90, position: 'insideRight' }}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="total_bookings" fill="#8884d8" name="Total Bookings" />
                        <Bar yAxisId="right" dataKey="avg_confidence" fill="#82ca9d" name="Avg Confidence" />
                      </BarChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 2 }}>
                      {providerData.slice(0, 5).map((provider) => (
                        <Box key={provider.provider_name} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{provider.provider_name}:</strong> {provider.total_bookings} bookings, 
                            Confidence: {provider.avg_confidence}, Success Rate: {provider.success_rate}%
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportToCSV(providerData, 'provider-performance.csv')}
                      sx={{ mt: 2 }}
                    >
                      Export
                    </Button>
                  </>
                ) : (
                  <Typography color="textSecondary">No provider data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Provider Ratings */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="⭐ Provider Ratings"
                subheader={`Rated Providers: ${providerRatingsData?.length || 0}`}
              />
              <CardContent>
                {providerRatingsData && providerRatingsData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={providerRatingsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="provider_name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis 
                          domain={[0, 5]}
                          label={{ value: 'Average Rating', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value) => `${parseFloat(value).toFixed(2)} stars`}
                          labelFormatter={(label) => `Provider: ${label}`}
                        />
                        <Bar 
                          dataKey="avg_rating" 
                          fill="#ffc658" 
                          name="Average Rating"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Top Rated Providers:
                      </Typography>
                      {providerRatingsData.slice(0, 5).map((provider) => (
                        <Box key={provider.provider_name} sx={{ mb: 1 }}>
                          <Typography variant="body2">
                            <strong>{provider.provider_name}:</strong> {provider.avg_rating.toFixed(2)} ⭐ 
                            ({provider.rating_count} {provider.rating_count === 1 ? 'rating' : 'ratings'})
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportToCSV(providerRatingsData, 'provider-ratings.csv')}
                      sx={{ mt: 2 }}
                    >
                      Export
                    </Button>
                  </>
                ) : (
                  <Typography color="textSecondary">No provider ratings available yet</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Card 5: Latency Trends */}
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="⏱️ Latency Trends"
                subheader={`Days Tracked: ${latencyData?.length || 0}`}
              />
              <CardContent>
                {latencyData && latencyData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={latencyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date"
                          label={{ value: 'Date', position: 'insideBottomRight', offset: -5 }}
                        />
                        <YAxis 
                          label={{ value: 'Latency (ms)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value) => `${parseFloat(value).toFixed(2)}ms`}
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="avg_latency" 
                          stroke="#8884d8" 
                          name="Avg Latency"
                          dot={{ fill: '#8884d8', r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="min_latency" 
                          stroke="#82ca9d" 
                          name="Min Latency"
                          strokeDasharray="5 5"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="max_latency" 
                          stroke="#ff7c7c" 
                          name="Max Latency"
                          strokeDasharray="5 5"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <Box sx={{ mt: 2 }}>
                      {latencyData.length > 0 && (
                        <Typography variant="body2">
                          Latest: Avg {latencyData[latencyData.length - 1].avg_latency}ms 
                          ({latencyData[latencyData.length - 1].requests} requests)
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      onClick={() => exportToCSV(latencyData, 'latency-trends.csv')}
                      sx={{ mt: 2 }}
                    >
                      Export
                    </Button>
                  </>
                ) : (
                  <Typography color="textSecondary">No latency data available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
