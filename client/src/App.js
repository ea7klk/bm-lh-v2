import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, FormControl, InputLabel, Box, Button, Link } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { io } from 'socket.io-client';
import AdminPage from './AdminPage';

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
  footer: {
    textAlign: 'center',
    marginTop: theme.spacing(4),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
}));

// Matomo tracking function
const trackPageView = (url) => {
  if (window._paq) {
    window._paq.push(['setCustomUrl', url]);
    window._paq.push(['trackPageView']);
  }
};

function App() {
  const classes = useStyles();
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('5m');
  const [continents, setContinents] = useState([]);
  const [selectedContinent, setSelectedContinent] = useState('Global');
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showAdminPage, setShowAdminPage] = useState(false);

  useEffect(() => {
    // Initialize Matomo
    window._paq = window._paq || [];
    (function() {
      var u = process.env.REACT_APP_MATOMO_URL;
      window._paq.push(['setTrackerUrl', u+'matomo.php']);
      window._paq.push(['setSiteId', process.env.REACT_APP_MATOMO_SITE_ID]);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.type='text/javascript'; g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
    })();

    // Track initial page view
    trackPageView('/');
  }, []);

  const fetchData = useCallback(() => {
    socket.emit('getGroupedData', { timeRange, continent: selectedContinent, country: selectedCountry });
    // Track data reload
    trackPageView(`/data/${timeRange}/${selectedContinent}/${selectedCountry || 'all'}`);
  }, [timeRange, selectedContinent, selectedCountry]);

  const fetchContinents = useCallback(() => {
    socket.emit('getContinents');
  }, []);

  const fetchCountries = useCallback(() => {
    if (selectedContinent !== 'Global') {
      socket.emit('getCountries', { continent: selectedContinent });
    } else {
      setCountries([]);
      setSelectedCountry('');
    }
  }, [selectedContinent]);

  useEffect(() => {
    fetchContinents();
    fetchCountries();

    socket.on('continents', (data) => {
      setContinents(['Global', ...data]);
    });

    socket.on('countries', (data) => {
      setCountries(data);
      setSelectedCountry(data.length > 0 ? data[0].value : '');
    });

    socket.on('groupedData', (data) => {
      setData(data);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.off('continents');
      socket.off('countries');
      socket.off('groupedData');
      socket.off('error');
    };
  }, [fetchContinents, fetchCountries]);

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, [fetchData]);

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  const handleContinentChange = (event) => {
    setSelectedContinent(event.target.value);
    setSelectedCountry('');
  };

  const handleCountryChange = (event) => {
    setSelectedCountry(event.target.value);
  };

  const filteredData = useMemo(() => {
    return data.filter(item => item._count.destinationName > 0);
  }, [data]);

  const chartData = {
    labels: filteredData.map(item => item.destinationName || 'N/A'),
    datasets: [
      {
        label: 'Count',
        data: filteredData.map(item => item._count.destinationName),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Destination Name Distribution' },
    },
  };

  if (showAdminPage) {
    return <AdminPage onBack={() => setShowAdminPage(false)} />;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" component="h1" gutterBottom className={classes.title}>
        What's on in Brandmeister?
      </Typography>
      <Box display="flex" justifyContent="center" mb={3}>
        <FormControl style={{ marginRight: '20px' }}>
          <InputLabel>Time Range</InputLabel>
          <Select value={timeRange} onChange={handleTimeRangeChange}>
            <MenuItem value="5m">Last 5 minutes</MenuItem>
            <MenuItem value="15m">Last 15 minutes</MenuItem>
            <MenuItem value="30m">Last 30 minutes</MenuItem>
            <MenuItem value="1h">Last hour</MenuItem>
            <MenuItem value="2h">Last 2 hours</MenuItem>
            <MenuItem value="6h">Last 6 hours</MenuItem>
            <MenuItem value="12h">Last 12 hours</MenuItem>
            <MenuItem value="24h">Last 24 hours</MenuItem>
          </Select>
        </FormControl>
        <FormControl style={{ marginRight: '20px' }}>
          <InputLabel>Continent</InputLabel>
          <Select value={selectedContinent} onChange={handleContinentChange}>
            {continents.map((continent) => (
              <MenuItem key={continent} value={continent}>{continent}</MenuItem>
            ))}
          </Select>
        </FormControl>
        {selectedContinent !== 'Global' && (
          <FormControl>
            <InputLabel>Country</InputLabel>
            <Select value={selectedCountry} onChange={handleCountryChange}>
              {countries.map((country) => (
                <MenuItem key={country.value} value={country.value}>{country.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Bar data={chartData} options={chartOptions} />

      <TableContainer component={Paper} style={{ marginTop: '20px' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Destination Name</TableCell>
              <TableCell>Destination ID</TableCell>
              <TableCell>Count</TableCell>
              <TableCell>Total Duration (seconds)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.destinationName || 'N/A'}</TableCell>
                <TableCell>{item.destinationId || 'N/A'}</TableCell>
                <TableCell>{item._count.destinationName}</TableCell>
                <TableCell>{item._sum.duration ? Math.round(item._sum.duration) : 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={3} display="flex" justifyContent="center">
        <Button variant="contained" color="primary" onClick={() => setShowAdminPage(true)}>
          Admin Page
        </Button>
      </Box>
      <footer className={classes.footer}>
        <Typography variant="body2" color="textSecondary">
          This website is provided by Volker Kerkhoff, 41089 Dos Hermanas (Spain). We do not use cookies, neither own or third-party. This application tracks usage using Matomo and does not use any personal data that isn't already publicly available. The complete <Link href="https://github.com/ea7klk/bm-lh-v2" target="_blank" rel="noopener noreferrer">source code is available on GitHub</Link> and is under MIT license. Please contact me via GitHub issues or volker at ea7klk dot es
        </Typography>
      </footer>
    </Container>
  );
}

export default App;