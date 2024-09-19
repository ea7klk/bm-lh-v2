import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing(3),
  },
  loginContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: theme.spacing(4),
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  tableContainer: {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  addTalkgroupForm: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(3),
  },
  formField: {
    marginRight: theme.spacing(2),
  },
}));

function AdminPage({ onBack, apiBaseUrl }) {
  const classes = useStyles();
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [talkgroups, setTalkgroups] = useState([]);
  const [newTalkgroup, setNewTalkgroup] = useState({ country: '', talkgroup: '', name: '' });
  const [token, setToken] = useState('');
  const [editingTalkgroup, setEditingTalkgroup] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    login();
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

  const openEditDialog = (talkgroup) => {
    setEditingTalkgroup(talkgroup);
    setOpenDialog(true);
  };

  const closeEditDialog = () => {
    setEditingTalkgroup(null);
    setOpenDialog(false);
  };

  const editTalkgroup = async () => {
    try {
      await axios.put(`${apiBaseUrl}/api/country-talkgroups/${editingTalkgroup.id}`, editingTalkgroup, {
        headers: { Authorization: token }
      });
      loadTalkgroups();
      closeEditDialog();
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
      <Container component="main" maxWidth="xs">
        <div className={classes.loginContainer}>
          <Typography component="h1" variant="h5">
            Login
          </Typography>
          <form className={classes.form} onSubmit={handleSubmit}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
            >
              Login
            </Button>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={onBack}
            >
              Back to Main Page
            </Button>
          </form>
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h2" component="h1" gutterBottom className={classes.title}>
        CountryTalkgroup Management
      </Typography>
      <Box className={classes.addTalkgroupForm}>
        <TextField
          className={classes.formField}
          label="Country"
          variant="outlined"
          value={newTalkgroup.country}
          onChange={(e) => setNewTalkgroup({ ...newTalkgroup, country: e.target.value })}
        />
        <TextField
          className={classes.formField}
          label="Talkgroup"
          variant="outlined"
          value={newTalkgroup.talkgroup}
          onChange={(e) => setNewTalkgroup({ ...newTalkgroup, talkgroup: e.target.value })}
        />
        <TextField
          className={classes.formField}
          label="Name"
          variant="outlined"
          value={newTalkgroup.name}
          onChange={(e) => setNewTalkgroup({ ...newTalkgroup, name: e.target.value })}
        />
        <Button variant="contained" color="primary" onClick={addTalkgroup}>
          Add Talkgroup
        </Button>
      </Box>
      <TableContainer component={Paper} className={classes.tableContainer}>
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
                  <Button color="primary" onClick={() => openEditDialog(tg)}>Edit</Button>
                  <Button color="secondary" onClick={() => deleteTalkgroup(tg.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box mt={3} display="flex" justifyContent="center">
        <Button variant="contained" color="secondary" onClick={onBack}>
          Back to Main Page
        </Button>
      </Box>

      <Dialog open={openDialog} onClose={closeEditDialog}>
        <DialogTitle>Edit Talkgroup</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Country"
            fullWidth
            value={editingTalkgroup?.country || ''}
            onChange={(e) => setEditingTalkgroup({ ...editingTalkgroup, country: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Talkgroup"
            fullWidth
            value={editingTalkgroup?.talkgroup || ''}
            onChange={(e) => setEditingTalkgroup({ ...editingTalkgroup, talkgroup: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={editingTalkgroup?.name || ''}
            onChange={(e) => setEditingTalkgroup({ ...editingTalkgroup, name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={editTalkgroup} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminPage;