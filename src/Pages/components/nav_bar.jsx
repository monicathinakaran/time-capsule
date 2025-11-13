// src/components/nav_bar.jsx (or your path)
import React from 'react';
// Make sure this path is correct for your project
import { supabase } from '../../supabase_client.js'; 
import { useNavigate, NavLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Button,
  useColorModeValue,
  HStack,
  Spacer,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { SettingsIcon, TriangleDownIcon } from '@chakra-ui/icons';

const Navbar = () => {
  const navigate = useNavigate();
  const formBg = useColorModeValue('white', 'gray.700');
  const brandColor = useColorModeValue('purple.600', 'purple.300'); // This is our main color

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // --- THIS IS THE UPDATED SECTION ---
  // We will now use the brandColor variable to ensure the colors match
  const activeLinkStyle = {
    fontWeight: 'bold',
    color: brandColor, // <-- FIX: Use the variable
    borderBottom: '2px solid',
    borderColor: brandColor, // <-- FIX: Use the variable
  };
  // --- END OF UPDATE ---

  return (
    <Box
      bg={formBg}
      px={8}
      boxShadow="md"
      position="fixed"
      width="100%"
      zIndex={10}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        
        <HStack spacing={8}>
          <Heading as="h1" size="lg" color={brandColor}>
            Time Capsule
          </Heading>
          
          <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
            <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
              My Capsule
            </NavLink>
            <NavLink to="/shared" style={({ isActive }) => isActive ? activeLinkStyle : undefined}>
              Shared Space
            </NavLink>
            <NavLink to="/inbox" style={({ isActive }) => isActive ? activeLinkStyle : undefined}> {/* <-- ADD THIS NAVLINK */}
              Inbox
            </NavLink>
          </HStack>
        </HStack>
        
        <Spacer />
        
        <Menu>
          <MenuButton as={Button} variant="ghost" rightIcon={<TriangleDownIcon boxSize={3} />}>
            Menu
          </MenuButton>
          <MenuList>
            {/* <MenuItem onClick={() => navigate('/settings')} icon={<SettingsIcon />}>
              Settings
            </MenuItem> */}
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </MenuList>
        </Menu>

      </Flex>
    </Box>
  );
};

export default Navbar;