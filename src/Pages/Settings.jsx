import React from 'react';
import { Box, Heading, Container } from '@chakra-ui/react';
import Navbar from './components/nav_bar.jsx';

const Settings = () => {
  return (
    <Box>
      <Navbar />
      <Box 
        bgGradient="linear(to-br, teal.100, purple.200)"
        minH="100vh"
        pt={16}
      >
        <Container maxW="container.lg" py={12}>
          <Heading>My Settings (Coming Soon!)</Heading>
        </Container>
      </Box>
    </Box>
  );
};

export default Settings;