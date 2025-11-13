// src/Pages/components/SharedFutureLetters.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js';
import {
  Box, Heading, Text, VStack, Spinner, useToast,
  Flex, IconButton, useColorModeValue,
  Button, FormControl, FormLabel, Textarea, Input
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const SharedFutureLetters = ({ capsuleId, session }) => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = session.user;
  const toast = useToast();
  const entryBg = useColorModeValue('white', 'gray.700');
  const today = new Date().setHours(0, 0, 0, 0);

  const [letterText, setLetterText] = useState('');
  const [unlockDate, setUnlockDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!capsuleId || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      const { data: lettersData, error: lettersError } = await supabase
        .from('shared_future_letters')
        .select('*')
        .eq('capsule_id', capsuleId)
        .order('unlock_date', { ascending: false });

      if (lettersError) {
        toast({ title: 'Error fetching letters', description: lettersError.message, status: 'error' });
      } else {
        setLetters(lettersData);
      }
      setLoading(false);
    };

    fetchData();
  }, [capsuleId, user, toast]);

  // --- ADD NEW LETTER ---
  const handleSaveLetter = async (e) => {
    e.preventDefault();
    if (!letterText) {
      toast({ title: "Please write a letter.", status: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('shared_future_letters')
        .insert({
          text: letterText,
          unlock_date: unlockDate.toISOString(),
          user_id: user.id,
          capsule_id: capsuleId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setLetters([data, ...letters]);
      setLetterText('');
      setUnlockDate(new Date());
      toast({ title: 'Shared letter sealed!', status: 'success' });
    } catch (error) {
      console.error('Error saving letter:', error.message);
      toast({ title: 'Error saving letter', description: error.message, status: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // --- DELETE LETTER (for everyone) ---
  const handleDeleteLetter = async (letter) => {
    if (!window.confirm("Are you sure you want to delete this letter? This will delete it for EVERYONE in this capsule.")) {
      return;
    }
    try {
      const { error } = await supabase
        .from('shared_future_letters')
        .delete()
        .eq('id', letter.id);

      if (error) throw error;

      setLetters(currentLetters => currentLetters.filter(l => l.id !== letter.id));
      toast({ title: 'Letter deleted for everyone', status: 'success' });

    } catch (error) {
      console.error("Error deleting item: ", error);
      toast({ title: 'Error deleting item', description: error.message, status: 'error' });
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* --- ADD NEW LETTER FORM --- */}
      <Box p={8} bg={entryBg} borderRadius="xl" boxShadow="lg">
        <form onSubmit={handleSaveLetter}>
          <VStack spacing={4}>
            <Heading size="md">Seal a Shared Letter</Heading>
            <FormControl isRequired>
              <FormLabel>Your Letter</FormLabel>
              <Textarea
                placeholder="Write a letter to the group..."
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
                rows={8}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>When should this letter unlock?</FormLabel>
              <DatePicker
                selected={unlockDate}
                onChange={(date) => setUnlockDate(date)}
                minDate={new Date()}
                customInput={<Input />}
                dateFormat="MMMM d, yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="purple"
              width="full"
              isLoading={saving}
              loadingText="Sealing..."
            >
              Seal Shared Letter
            </Button>
          </VStack>
        </form>
      </Box>

      {/* --- "Sealed Letters" List --- */}
      <Heading size="lg" mb={4}>Capsule Letters</Heading>
      {letters.length === 0 ? (
        <Text>No letters found in this capsule.</Text>
      ) : (
        letters.map((letter) => {
          const letterUnlockDate = new Date(letter.unlock_date).setHours(0, 0, 0, 0);
          const isLocked = letterUnlockDate > today;
          return (
            <Box key={letter.id} p={5} bg={isLocked ? 'gray.100' : entryBg} borderRadius="xl" boxShadow="md">
              <Flex justify="space-between" align="center" mb={2}>
                <Heading size="md">
                  {isLocked ? '🔒 Sealed Letter' : '📬 Unlocked!'}
                </Heading>
                <IconButton
                  icon={<DeleteIcon />}
                  size="sm"
                  variant="ghost"
                  colorScheme="red"
                  aria-label="Delete letter"
                  onClick={() => handleDeleteLetter(letter)}
                  // This is your rule:
                  isDisabled={isLocked}
                  title={isLocked ? "You cannot delete a letter until it is unlocked." : "Permanently delete this letter for all members"}
                />
              </Flex>
              <Text fontSize="sm" color="gray.500" pt={1}>
                {isLocked
                  ? `Unlocks on: ${new Date(letter.unlock_date).toLocaleDateString()}`
                  : `Unlocked on: ${new Date(letter.unlock_date).toLocaleDateString()}`}
              </Text>
              {!isLocked && (
                <Text mt={4} p={4} bg="purple.50" borderRadius="md" whiteSpace="pre-wrap">
                  {letter.text}
                </Text>
              )}
            </Box>
          );
        })
      )}
    </VStack>
  );
};

export default SharedFutureLetters;