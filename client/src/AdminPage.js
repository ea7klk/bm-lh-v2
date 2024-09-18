import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function AdminPage({ onBack, apiBaseUrl }) {
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
      <div>
        <h2>Login</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
        />
        <button onClick={login}>Login</button>
        <button onClick={onBack}>Back to Main Page</button>
      </div>
    );
  }

  return (
    <div>
      <h1>CountryTalkgroup Management</h1>
      <div>
        <h2>Add New Talkgroup</h2>
        <input
          type="text"
          value={newTalkgroup.country}
          onChange={(e) => setNewTalkgroup({ ...newTalkgroup, country: e.target.value })}
          placeholder="Country"
        />
        <input
          type="text"
          value={newTalkgroup.talkgroup}
          onChange={(e) => setNewTalkgroup({ ...newTalkgroup, talkgroup: e.target.value })}
          placeholder="Talkgroup"
        />
        <input
          type="text"
          value={newTalkgroup.name}
          onChange={(e) => setNewTalkgroup({ ...newTalkgroup, name: e.target.value })}
          placeholder="Name"
        />
        <button onClick={addTalkgroup}>Add Talkgroup</button>
      </div>
      <h2>Existing Talkgroups</h2>
      <table>
        <thead>
          <tr>
            <th>Country</th>
            <th>Talkgroup</th>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {talkgroups.map((tg) => (
            <tr key={tg.id}>
              <td>{tg.country}</td>
              <td>{tg.talkgroup}</td>
              <td>{tg.name}</td>
              <td>
                <button onClick={() => editTalkgroup(tg.id)}>Edit</button>
                <button onClick={() => deleteTalkgroup(tg.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={onBack}>Back to Main Page</button>
    </div>
  );
}

export default AdminPage;