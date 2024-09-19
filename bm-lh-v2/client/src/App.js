import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, List, ListItem, ListItemText, CircularProgress } from '@material-ui/core';

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get('/api/items');
        setItems(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching items:', error);
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  return (
    <Container maxWidth="md">
      <Typography variant="h2" component="h1" gutterBottom>
        BM-LH-V2 App
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : (
        <List>
          {items.map((item) => (
            <ListItem key={item.id}>
              <ListItemText primary={item.name} secondary={item.description} />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
}

export default App;