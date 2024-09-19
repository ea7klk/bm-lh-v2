import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Select, MenuItem, FormControl, InputLabel, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { io } from 'socket.io-client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const socket = io(API_BASE_URL, {
  transports: ['websocket', 'polling'],
  path: '/socket.io',
});

const useStyles = makeStyles((theme) => ({
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing(3),
  },
  tableContainer: {
    marginTop: theme.spacing(3),
  },
}));

function TalkgroupHistogram() {
  const classes = useStyles();
  const [continents, setContinents] = useState([]);
  const [selectedContinent, setSelectedContinent] = useState('Global');
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [talkgroups, setTalkgroups] = useState([]);
  const [selectedTalkgroup, setSelectedTalkgroup] = useState('');
  const [histogramData, setHistogramData] = useState([]);

  const fetchContinents = useCallback(() => {
    console.log('Fetching continents...');
    socket.emit('getContinents');
  }, []);

  const fetchCountries = useCallback(() => {
    console.log('Fetching countries for continent:', selectedContinent);
    if (selectedContinent !== 'Global') {
      socket.emit('getCountries', { continent: selectedContinent });
    } else {
      setCountries([]);
      setSelectedCountry('');
    }
  }, [selectedContinent]);

  const fetchTalkgroups = useCallback(() => {
    console.log('Fetching talkgroups for continent:', selectedContinent, 'and country:', selectedCountry);
    socket.emit('getTalkgroups', { continent: selectedContinent, country: selectedCountry });
  }, [selectedContinent, selectedCountry]);

  const fetchHistogramData = useCallback(() => {
    if (selectedTalkgroup) {
      console.log('Fetching histogram data for talkgroup:', selectedTalkgroup);
      const timezoneOffset = -new Date().getTimezoneOffset();
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
      socket.emit('getTalkgroupHistogram', { 
        talkgroup: selectedTalkgroup, 
        timezoneOffset,
        startTime: startTime.getTime(),
        endTime: endTime.getTime()
      });
    }
  }, [selectedTalkgroup]);

  useEffect(() => {
    fetchContinents();
    fetchCountries();

    socket.on('continents', (data) => {
      console.log('Received continents:', data);
      setContinents(['Global', ...data]);
    });

    socket.on('countries', (data) => {
      console.log('Received countries:', data);
      setCountries(data);
      setSelectedCountry(data.length > 0 ? data[0].value : '');
    });

    socket.on('talkgroups', (data) => {
      console.log('Received talkgroups:', data);
      setTalkgroups(data);
      setSelectedTalkgroup(data.length > 0 ? data[0].value : '');
    });

    socket.on('talkgroupHistogram', (data) => {
      console.log('Received histogram data:', data);
      const now = new Date();
      now.setMinutes(0, 0, 0); // Set to the start of the current hour
      const endTime = now;
      const startTime = new Date(endTime.getTime() - 12 * 60 * 60 * 1000);

      // Generate all hour intervals for the last 12 hours
      const intervals = [];
      for (let d = new Date(startTime); d <= endTime; d.setHours(d.getHours() + 1)) {
        intervals.push(d.getTime());
      }

      // Count events for each interval
      const eventCounts = new Array(intervals.length).fill(0);
      data.forEach(event => {
        const eventTime = parseInt(event.timestamp);
        const index = intervals.findIndex((interval, i) => 
          eventTime >= interval && (i === intervals.length - 1 || eventTime < intervals[i + 1])
        );
        if (index !== -1) {
          eventCounts[index]++;
        }
      });

      // Create histogram data
      const histogramData = intervals.map((interval, index) => ({
        timeInterval: interval,
        count: eventCounts[index]
      }));

      setHistogramData(histogramData);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.off('continents');
      socket.off('countries');
      socket.off('talkgroups');
      socket.off('talkgroupHistogram');
      socket.off('error');
    };
  }, [fetchContinents, fetchCountries]);

  useEffect(() => {
    fetchTalkgroups();
  }, [fetchTalkgroups]);

  useEffect(() => {
    fetchHistogramData();
  }, [fetchHistogramData]);

  const handleContinentChange = (event) => {
    const newContinent = event.target.value;
    console.log('Continent changed to:', newContinent);
    setSelectedContinent(newContinent);
    setSelectedCountry('');
    setSelectedTalkgroup('');
  };

  const handleCountryChange = (event) => {
    const newCountry = event.target.value;
    console.log('Country changed to:', newCountry);
    setSelectedCountry(newCountry);
    setSelectedTalkgroup('');
  };

  const handleTalkgroupChange = (event) => {
    const newTalkgroup = event.target.value;
    console.log('Talkgroup changed to:', newTalkgroup);
    setSelectedTalkgroup(newTalkgroup);
  };

  const formatTimeInterval = (timeInterval) => {
    const date = new Date(timeInterval);
    return date.toLocaleString('en-US', { 
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const chartData = {
    labels: histogramData.map(item => formatTimeInterval(item.timeInterval)),
    datasets: [
      {
        label: 'Event Count',
        data: histogramData.map(item => item.count),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Talkgroup Activity Histogram (Last 12 Hours)' },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (Local)',
        },
        ticks: {
          callback: function(value, index) {
            // Show every 3rd label to prevent overcrowding
            return index % 3 === 0 ? this.getLabelForValue(value) : '';
          }
        }
      },
      y: {
        title: {
          display: true,
          text: 'Event Count',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" component="h1" gutterBottom className={classes.title}>
        Talkgroup Activity Histogram
      </Typography>
      <Box display="flex" justifyContent="center" mb={3}>
        <FormControl style={{ marginRight: '20px' }}>
          <InputLabel>Continent</InputLabel>
          <Select value={selectedContinent} onChange={handleContinentChange}>
            {continents.map((continent) => (
              <MenuItem key={continent} value={continent}>{continent}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedContinent !== 'Global' && (
          <FormControl style={{ marginRight: '20px' }}>
            <InputLabel>Country</InputLabel>
            <Select value={selectedCountry} onChange={handleCountryChange}>
              {countries.map((country) => (
                <MenuItem key={country.value} value={country.value}>{country.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <FormControl>
          <InputLabel>Talkgroup</InputLabel>
          <Select value={selectedTalkgroup} onChange={handleTalkgroupChange}>
            {talkgroups.map((talkgroup) => (
              <MenuItem key={talkgroup.value} value={talkgroup.value}>{talkgroup.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Bar data={chartData} options={chartOptions} />

      <TableContainer component={Paper} className={classes.tableContainer}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Time (Local)</TableCell>
              <TableCell align="right">Call Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {histogramData.map((row) => (
              <TableRow key={row.timeInterval}>
                <TableCell component="th" scope="row">
                  {formatTimeInterval(row.timeInterval)}
                </TableCell>
                <TableCell align="right">{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default TalkgroupHistogram;