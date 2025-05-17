import React from 'react';
import { Button, Box, Heading } from '@chakra-ui/react';

const Login = () => {
  const handleLogin = () => {
    window.location.href = 'http://localhost:8080/auth/ebay';
  };

  return (
    <Box textAlign="center" mt={10}>
      <Heading mb={6}>eBay Seller Dashboard</Heading>
      <Button colorScheme="blue" size="lg" onClick={handleLogin}>
        Sign in with eBay
      </Button>
    </Box>
  );
};

export default Login;
