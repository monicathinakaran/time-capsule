// src/Pages/Login.jsx
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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const brandColor = useColorModeValue('purple.600', 'purple.300');
  const formBg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <form onSubmit={handleLogin}>
            <VStack spacing={6}>
              <Heading as="h1" size="xl" color={brandColor}>Time Capsule</Heading>
              
              {/* --- THIS IS THE CHANGED LINE --- */}
              <Text fontSize="lg" color={textColor} fontWeight="bold">Sign In</Text>

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

              <Button
                type="submit"
                colorScheme="purple"
                size="lg"
                width="full"
                isLoading={loading}
                disabled={loading}
              >
                {loading ? 'Logging In...' : 'Login'}
              </Button>
            </VStack>
          </form>
          <Text mt={6} textAlign="center" color={textColor}>
            Don't have an account?{' '}
            <Link as={RouterLink} to="/signup" color={brandColor} fontWeight="bold">
              Sign Up
            </Link>
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;