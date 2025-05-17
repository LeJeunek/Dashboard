import React, { useEffect, useState } from 'react';
import {
  Box, Heading, Text, UnorderedList, ListItem,
  Spinner, Alert, AlertIcon
} from '@chakra-ui/react';
import axios from 'axios';

const Dashboard = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('Access token not found. Please sign in again.');
      setLoading(false);
      return;
    }

    const fetchListings = async () => {
      try {
        const response = await axios.get('http://localhost:8080/ebay/listings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setListings(response.data.ActiveList?.ItemArray?.Item || []);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to fetch listings.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  return (
    <Box p={6}>
      <Heading mb={4}>Seller Dashboard</Heading>

      {loading && (
        <Box><Spinner /><Text>Loading...</Text></Box>
      )}

      {error && (
        <Alert status="error"><AlertIcon />{error}</Alert>
      )}

      {!loading && !error && (
        listings.length > 0 ? (
          <UnorderedList spacing={3}>
            {listings.map((item, idx) => (
              <ListItem key={idx}>
                <strong>{item.Title}</strong> — ${item.SellingStatus?.CurrentPrice?.Value}
              </ListItem>
            ))}
          </UnorderedList>
        ) : (
          <Text>No active listings found.</Text>
        )
      )}
    </Box>
  );
};

export default Dashboard;
