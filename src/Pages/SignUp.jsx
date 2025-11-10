// src/Pages/SignUp.jsx
import React, { useState } from 'react';
import { supabase } from "../supabase_client.js"; // Make sure path is correct
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  Link,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Define the same colors as the login page
  const brandColor = useColorModeValue('purple.600', 'purple.300');
  const formBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  // Change the handler function to use supabase.auth.signUp
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use signUp instead of signInWithPassword
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      alert('Sign up successful! Please log in.');
      navigate('/login'); // Redirect to login page so they can sign in
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Use the same gradient background
    <Box 
      bgGradient="linear(to-br, teal.100, purple.200)"
      minH="100vh" 
      py={12} 
      px={{ base: 4, lg: 8 }} 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
    >
      <Container centerContent>
        <Box
          p={{ base: 6, md: 10 }}
          maxWidth="480px"
          width="100%"
          borderWidth={1}
          borderRadius="xl"
          boxShadow="2xl"
          bg={formBg}
          borderColor={useColorModeValue('gray.200', 'gray.600')}
        >
          {/* Change form handler to handleSignUp */}
          <form onSubmit={handleSignUp}>
            <VStack spacing={6}>
              <Heading as="h1" size="xl" color={brandColor}>Time Capsule</Heading>
              
              {/* Change text to "Create Account" */}
              <Text fontSize="lg" color={textColor} fontWeight="bold">Create Account</Text>

              <FormControl isRequired>
                <FormLabel color={textColor}>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  borderColor={useColorModeValue('gray.300', 'gray.500')}
                  _hover={{ borderColor: brandColor }}
                  _focus={{ borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textColor}>Password</FormLabel>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  borderColor={useColorModeValue('gray.300', 'gray.500')}
                  _hover={{ borderColor: brandColor }}
                  _focus={{ borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` }}
                />
              </FormControl>

              {/* Change button text to "Sign Up" */}
              <Button
                type="submit"
                colorScheme="purple"
                size="lg"
                width="full"
                isLoading={loading}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </VStack>
          </form>
          {/* Change the link to point back to the login page */}
          <Text mt={6} textAlign="center" color={textColor}>
            Already have an account?{' '}
            <Link as={RouterLink} to="/login" color={brandColor} fontWeight="bold">
              Log In
            </Link>
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default SignUp;