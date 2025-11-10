// src/components/Navbar.jsx
import React from 'react';
import { supabase } from "../../supabase_client.js"; // Adjust path as needed
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';

const Navbar = () => {
  const navigate = useNavigate();
  const formBg = useColorModeValue('white', 'gray.700');
  const brandColor = useColorModeValue('purple.600', 'purple.300');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login'); // Navigate to login after logout
  };

  return (
    <Box
      bg={formBg}
      px={4}
      boxShadow="md"
      position="fixed" // Make it stick to the top
      width="100%"
      zIndex={1} // Ensure it's above other content
    >
    <Flex h={16} alignItems="center" justifyContent="space-between">
      <RouterLink to="/dashboard"> {/* Make the logo a link */}
        <Heading as="h1" size="lg" color={brandColor}>
          Time Capsule
        </Heading>
      </RouterLink>
      <Button colorScheme="purple" variant="ghost" onClick={handleLogout}>
        Logout
      </Button>
    </Flex>
    </Box>
  );
};

export default Navbar;