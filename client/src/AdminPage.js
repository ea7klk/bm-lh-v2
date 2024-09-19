import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Container, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing(3),
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    '& > *': {
      margin: theme.spacing(1),
      width: '25ch',
    },
  },
  table: {
    marginTop: theme.spacing(3),
  },
  actionButton: {
    margin: theme.spacing(0, 1),
  },
}));

function AdminPage({ onBack, apiBaseUrl }) {
  const classes = useStyles();
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [talkgroups, setTalkgroups] = useState([]);
  const [newTalkgroup, setNewTalkgroup] = useState({ country: '', talkgroup: '', name: '' });
  const [token, setToken] = useState('');

  const loadTalkgroups = useCallback(async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/country-talkgroups`, {
        headers: { Authorization: token }
      });
      setTalkgroups(response.data);
    } catch (error) {
      console.error('Error loading talkgroups:', error);
    }
  }, [token, apiBaseUrl]);

  useEffect(() => {
    if (isLoggedIn) {
      loadTalkgroups();
    }
  }, [isLoggedIn, loadTalkgroups]);

  const login = async () => {
    try {
      const response = await axios.post(`${apiBaseUrl}/api/login`, { password });
      setToken(response.data.token);
      setIsLoggedIn(true);
    } catch (error) {
      alert('Login failed');
    }
  };

  const addTalkgroup = async () => {
    try {
      await axios.post(`${apiBaseUrl}/api/country-talkgroups`, newTalkgroup, {
        headers: { Authorization: token }
      });
      loadTalkgroups();
      setNewTalkgroup({ country: '', talkgroup: '', name: '' });
    } catch (error) {
      console.error('Error adding talkgroup:', error);
    }
  };

  const editTalkgroup = async (id) => {
    const updatedTalkgroup = {
      country: prompt('Enter new country:'),
      talkgroup: prompt('Enter new talkgroup:'),
      name: prompt('Enter new name:')
    };
    try {
      await axios.put(`${apiBaseUrl}/api/country-talkgroups/${id}`, updatedTalkgroup, {
        headers: { Authorization: token }
      });
      loadTalkgroups();
    } catch (error) {
      console.error('Error updating talkgroup:', error);
    }
  };

  const deleteTalkgroup = async (id) => {
    if (window.confirm('Are you sure you want to delete this talkgroup?')) {
      try {
        await axios.delete(`${apiBaseUrl}/api/country-talkgroups/${id}`, {
          headers: { Authorization: token }
        });
        loadTalkgroups();
      } catch (error) {
        console.error('Error deleting talkgroup:', error);
      }
    }
  };

  if (!isLoggedIn) {
    return (
      <Container maxWidth="sm">
        <Typography variant="h4" className={classes.title}>Login</Typography>
        <form className={classes.form} noValidate autoComplete="off">
          <TextField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            variant="outlined"
          />
          <Button variant="contained" color="primary" onClick={login}>Login</Button>
          <Button variant="contained" onClick={onBack}>Back to Main Page</Button>
        </form>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" className={classes.title}>CountryTalkgroup Management</Typography>
      <Paper>
        <Box p={3}>
          <Typography variant="h5">Add New Talkgroup</Typography>
          <form className={classes.form} noValidate autoComplete="off">
            <TextField
              value={newTalkgroup.country}
              onChange={(e) => setNewTalkgroup({ ...newTalkgroup, country: e.target.value })}
              label="Country"
              variant="outlined"
            />
            <TextField
              value={newTalkgroup.talkgroup}
              onChange={(e) => setNewTalkgroup({ ...newTalkgroup, talkgroup: e.target.value })}
              label="Talkgroup"
              variant="outlined"
            />
            <TextField
              value={newTalkgroup.name}
              onChange={(e) => setNewTalkgroup({ ...newTalkgroup, name: e.target.value })}
              label="Name"
              variant="outlined"
            />
            <Button variant="contained" color="primary" onClick={addTalkgroup}>Add Talkgroup</Button>
          </form>
        </Box>
      </Paper>
      <Typography variant="h5" style={{ marginTop: '20px' }}>Existing Talkgroups</Typography>
      <TableContainer component={Paper} className={classes.table}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Country</TableCell>
              <TableCell>Talkgroup</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {talkgroups.map((tg) => (
              <TableRow key={tg.id}>
                <TableCell>{tg.country}</TableCell>
                <TableCell>{tg.talkgroup}</TableCell>
                <TableCell>{tg.name}</TableCell>
                <TableCell>
                  <Button variant="outlined" color="primary" className={classes.actionButton} onClick={() => editTalkgroup(tg.id)}>Edit</Button>
                  <Button variant="outlined" color="secondary" className={classes.actionButton} onClick={() => deleteTalkgroup(tg.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={3} display="flex" justifyContent="center">
        <Button variant="contained" color="primary" onClick={onBack}>Back to Main Page</Button>
      </Box>
    </Container>
  );
}

export default AdminPage;