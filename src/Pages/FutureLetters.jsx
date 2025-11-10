// src/Pages/FutureLetters.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Spinner,
  Input,
} from '@chakra-ui/react';
import DatePicker from 'react-datepicker';

// 1. ADD THE DATEPICKER CSS IN THIS FILE (or main.jsx)
// This is to make sure the new dropdowns are styled correctly
import 'react-datepicker/dist/react-datepicker.css';

const FutureLetters = ({ session }) => {
  const [letters, setLetters] = useState([]);
  const [letterText, setLetterText] = useState('');
  const [unlockDate, setUnlockDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = session.user;
  const formBg = useColorModeValue('white', 'gray.700');

  // ... (useEffect and handleSaveLetter functions remain the same) ...

  // 1. Fetch letters from DB
  useEffect(() => {
    const getLetters = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('future_letters')
        .select('*')
        .eq('user_id', user.id)
        .order('unlock_date', { ascending: false });

      if (error) console.error('Error fetching letters:', error);
      else setLetters(data);
      setLoading(false);
    };
    getLetters();
  }, [user.id]);

  // 2. Handle Save Letter
  const handleSaveLetter = async (e) => {
    e.preventDefault();
    setSaving(true);

    const { data, error } = await supabase
      .from('future_letters')
      .insert({
        text: letterText,
        user_id: user.id,
        unlock_date: unlockDate.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving letter:', error);
    } else {
      setLetters([data, ...letters]);
      setLetterText('');
    }
    setSaving(false);
  };

  const today = new Date().setHours(0, 0, 0, 0);

  return (
    <VStack spacing={8} align="stretch">
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <form onSubmit={handleSaveLetter}>
          <VStack spacing={4}>
            <Heading size="md">Write a Letter to Your Future Self</Heading>
            <FormControl isRequired>
              <FormLabel>Your Letter</FormLabel>
              <Textarea
                placeholder="Dear Future Me..."
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                rows={8}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>When should this letter unlock?</FormLabel>
              
              {/* --- THIS IS THE UPDATED COMPONENT --- */}
              <DatePicker
                selected={unlockDate}
                onChange={(date) => setUnlockDate(date)}
                minDate={new Date()}
                customInput={<Input />}
                dateFormat="MMMM d, yyyy"
                
                // 2. ADD THESE PROPS
                showYearDropdown    // Adds the year dropdown
                showMonthDropdown   // Adds the month dropdown
                dropdownMode="select" // Makes them scrollable
              />
              {/* --- END OF UPDATE --- */}
              
            </FormControl>
            <Button
              type="submit"
              colorScheme="purple"
              width="full"
              isLoading={saving}
              loadingText="Sealing..."
            >
              Seal Letter
            </Button>
          </VStack>
        </form>
      </Box>

      {/* ... (rest of the component remains the same) ... */}
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={4}>Your Sealed Letters</Heading>
        {loading ? (
          <Spinner size="xl" />
        ) : letters.length === 0 ? (
          <Text>No letters found.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {letters.map((letter) => {
              const letterUnlockDate = new Date(letter.unlock_date).setHours(0, 0, 0, 0);
              const isLocked = letterUnlockDate > today;

              return (
                <Box key={letter.id} p={5} bg={isLocked ? 'gray.100' : 'white'} borderRadius="md" boxShadow="sm" borderWidth={isLocked ? "1px" : "0"}>
                  <Heading size="md">
                    {isLocked ? '🔒 Sealed Letter' : '📬 Unlocked!'}
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    {isLocked
                      ? `Unlocks on: ${new Date(letter.unlock_date).toLocaleDateString()}`
                      : `Unlocked on: ${new Date(letter.unlock_date).toLocaleDateString()}`}
                  </Text>
                  {!isLocked && (
                    <Text mt={4} p={4} bg="purple.50" borderRadius="md">
                      {letter.text}
                    </Text>
                  )}
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default FutureLetters;