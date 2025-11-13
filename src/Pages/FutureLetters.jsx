// src/Pages/FutureLetters.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js'; // Adjust path
import {
  Box, Button, FormControl, FormLabel, Textarea, VStack,
  Heading, Text, useColorModeValue, Spinner, Input, useToast,
  Flex, IconButton, useDisclosure, HStack
} from '@chakra-ui/react';
import { ChatIcon, DeleteIcon } from '@chakra-ui/icons';
import { IoSend } from 'react-icons/io5';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// Make sure this path is correct
import { ShareModal } from './components/ShareModal.jsx'; 

const FutureLetters = ({ session }) => {
  const [letters, setLetters] = useState([]);
  const [letterText, setLetterText] = useState('');
  const [unlockDate, setUnlockDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const user = session.user;
  const formBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  const today = new Date().setHours(0, 0, 0, 0);

  const { isOpen: isShareModalOpen, onOpen: onShareModalOpen, onClose: onShareModalClose } = useDisclosure();
  const [itemToShare, setItemToShare] = useState(null);

  // --- 1. FETCH LETTERS (Updated for Soft Delete) ---
  useEffect(() => {
    const getLetters = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('future_letters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false) // <-- Hides deleted letters
        .order('unlock_date', { ascending: false });
        
      if (error) { toast({ title: 'Error fetching letters', description: error.message, status: 'error' }); }
      else { setLetters(data); }
      setLoading(false);
    };
    getLetters();
  }, [user.id, toast]);

  // --- 2. SAVE NEW LETTER (Unchanged) ---
  const handleSaveLetter = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.from('future_letters').insert({ text: letterText, unlock_date: unlockDate.toISOString(), user_id: user.id }).select().single();
    if (error) {
      console.error('Error saving letter:', error);
      toast({ title: 'Error saving letter', description: error.message, status: 'error' });
    } else {
      setLetters([data, ...letters]);
      setLetterText('');
      toast({ title: 'Letter sealed!', status: 'success' });
    }
    setSaving(false);
  };
  
  // --- 3. SHARE LETTER (Unchanged) ---
  const handleShareClick = (letter) => {
    setItemToShare({
      ...letter,
      item_type: 'letter', 
      unlock_date: letter.unlock_date,
    });
    onShareModalOpen();
  };

  // --- 4. SOFT DELETE LETTER (New) ---
  const handleDeleteLetter = async (letter) => {
    if (!window.confirm("Are you sure you want to remove this letter? It will still be visible to anyone you've shared it with.")) {
      return;
    }
    try {
      const { error } = await supabase
        .from('future_letters')
        .update({ is_deleted: true }) // <-- Set the flag
        .eq('id', letter.id);

      if (error) throw error;
      setLetters(currentLetters => currentLetters.filter(l => l.id !== letter.id));
      toast({ title: 'Letter removed', status: 'success' });
    } catch (error) {
      console.error('Error removing letter:', error.message);
      toast({ title: 'Error removing letter', description: error.message, status: 'error' });
    }
  };

  if (loading) {
    return (
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg" textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  // --- RENDER ---
  return (
    <VStack spacing={8} align="stretch">
      
      {/* --- THIS IS THE "Seal a Letter" FORM (It was not missing) --- */}
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
              Seal Letter
            </Button>
          </VStack>
        </form>
      </Box>
      {/* --- END OF "Seal a Letter" FORM --- */}


      {/* --- "Your Sealed Letters" section (Updated with delete logic) --- */}
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={4}>Your Sealed Letters</Heading>
        {letters.length === 0 ? (
          <Text>No letters found.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {letters.map((letter) => {
              const letterUnlockDate = new Date(letter.unlock_date).setHours(0, 0, 0, 0);
              const isLocked = letterUnlockDate > today;

              return (
                <Box key={letter.id} p={5} bg={isLocked ? 'gray.100' : 'white'} borderRadius="md" boxShadow="sm" borderWidth="1px">
                  <VStack align="start" spacing={1}>
                    <Flex justify="space-between" align="center" w="100%">
                      <Heading size="md">
                        {isLocked ? '🔒 Sealed Letter' : '📬 Unlocked!'}
                      </Heading>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<IoSend />}
                          size="sm"
                          variant="ghost"
                          colorScheme="purple"
                          aria-label="Share letter"
                          onClick={() => handleShareClick(letter)}
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="red"
                          aria-label="Delete letter"
                          onClick={() => handleDeleteLetter(letter)}
                          // This enforces your rule:
                          isDisabled={isLocked} 
                          title={isLocked ? "You cannot delete a letter until it is unlocked." : "Delete this letter"}
                        />
                      </HStack>
                    </Flex>
                    <Text fontSize="sm" color="gray.500" pt={1}>
                      {isLocked
                        ? `Unlocks on: ${new Date(letter.unlock_date).toLocaleDateString()}`
                        : `Unlocked on: ${new Date(letter.unlock_date).toLocaleDateString()}`}
                    </Text>
                  </VStack>
                  
                  {!isLocked && (
                    <Text mt={4} p={4} bg="purple.50" borderRadius="md" whiteSpace="pre-wrap">
                      {letter.text}
                    </Text>
                  )}
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>

      {/* --- Modal (Unchanged) --- */}
      <ShareModal
        session={session}
        isOpen={isShareModalOpen}
        onClose={onShareModalClose}
        itemToShare={itemToShare}
      />
    </VStack>
  );
};

export default FutureLetters;