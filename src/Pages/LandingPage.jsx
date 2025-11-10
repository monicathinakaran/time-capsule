// src/Pages/LandingPage.jsx
import React from 'react';
import Lottie from "lottie-react";
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';

// Make sure this path matches the JSON file you downloaded
import animationData from "../assets/capsule-animation.json"; 

const LandingPage = () => {
  // We'll use the same colors as your login form
  const formBg = useColorModeValue('white', 'gray.700');
  const brandColor = useColorModeValue('purple.600', 'purple.300');
  const textColor = useColorModeValue('gray.700', 'gray.600');

  return (
    <Box
      bgGradient="linear(to-br, teal.100, purple.200)"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
      px={{ base: 4, lg: 8 }}
    >
      <Container centerContent>
        
        {/* 1. Create a new white "card" to hold all content */}
        <Box
          p={{ base: 6, md: 10 }}
          maxWidth="600px" // A wider card
          width="100%"
          borderWidth={1}
          borderRadius="xl"
          boxShadow="2xl"
          bg={formBg}
          borderColor={useColorModeValue('gray.200', 'gray.600')}
        >
          {/* 2. Put the VStack *inside* the card */}
          <VStack spacing={6}> 
            
            {/* Lottie Animation */}
            <Box boxSize={{ base: '200px', md: '300px' }}>
              <Lottie animationData={animationData} loop={true} />
            </Box>

            <Heading
              as="h1"
              size={{ base: 'xl', md: '2xl' }}
              color={brandColor}
              textAlign="center"
            >
              Welcome to Time Capsule
            </Heading>
            
            <Text 
              fontSize={{ base: 'md', md: 'lg' }}
              color={textColor} 
              textAlign="center"
              maxW="450px" // Keep the text from getting too wide
            >
              Your personal digital vault for preserving memories,
              goals, and letters to your future self.
            </Text>
            
            {/* Login/Signup Buttons */}
            <HStack spacing={6} pt={4}>
              <Button
                as={RouterLink}
                to="/login"
                colorScheme="purple"
                size="lg"
              >
                Log In
              </Button>
              <Button
                as={RouterLink}
                to="/signup"
                colorScheme="purple"
                variant="outline"
                size="lg"
              >
                Sign Up
              </Button>
            </HStack>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;