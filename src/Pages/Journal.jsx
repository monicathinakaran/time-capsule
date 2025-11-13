// src/Pages/Journal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js'; // Adjust path
import {
  Box, Button, FormControl, FormLabel, Textarea, Input, VStack,
  Heading, Text, Image, useColorModeValue, Spinner, useToast,
  HStack, IconButton, useDisclosure, Flex,
} from '@chakra-ui/react';
// Import all 3 icons
import { ChatIcon, DeleteIcon, DownloadIcon } from '@chakra-ui/icons'; 
import { v4 as uuidv4 } from 'uuid';
import { IoSend } from 'react-icons/io5';
import { ShareModal } from './components/ShareModal.jsx'; // Make sure path is correct

const Journal = ({ session }) => {
  const [entries, setEntries] = useState([]);
  const [entryText, setEntryText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null); // For download spinner
  const user = session.user;
  const formBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();
  
  const { isOpen: isShareModalOpen, onOpen: onShareModalOpen, onClose: onShareModalClose } = useDisclosure();
  const [itemToShare, setItemToShare] = useState(null);

  // --- 1. FETCH ENTRIES (Updated for Soft Delete) ---
  useEffect(() => {
    const getEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('journal')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false) // <-- This hides "soft deleted" entries
        .order('created_at', { ascending: false });
        
      if (error) { toast({ title: 'Error fetching entries', description: error.message, status: 'error' }); }
      else { setEntries(data); }
      setLoading(false);
    };
    getEntries();
  }, [user.id, toast]);

  // --- 2. SUBMIT NEW ENTRY (Unchanged) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let imageUrl = null;
    try {
      if (file) {
        const filePath = `journal_images/${user.id}/${uuidv4()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('journal-images').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('journal-images').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
      const { data, error: insertError } = await supabase.from('journal').insert({ text: entryText, image_url: imageUrl, user_id: user.id }).select().single();
      if (insertError) throw insertError;
      setEntryText('');
      setFile(null);
      setEntries([data, ...entries]); // Add to top of list
      toast({ title: 'Entry saved!', status: 'success' });
    } catch (error) {
      console.error('Error in handleSubmit:', error.message);
      toast({ title: 'Error saving entry', description: error.message, status: 'error' });
    } finally {
      setUploading(false);
    }
  };
  
  // --- 3. SHARE ENTRY (Unchanged) ---
  const handleShareClick = (entry) => {
    setItemToShare({
      ...entry,
      item_type: 'journal',
      unlock_date: null,
    });
    onShareModalOpen();
  };

  // --- 4. SOFT DELETE ENTRY (Updated) ---
  const handleDeleteEntry = async (entry) => {
    if (!window.confirm("Are you sure you want to remove this journal entry? It will still be visible to anyone you've shared it with.")) {
      return;
    }
    try {
      // This is the "soft delete" - just flag it, don't delete the row
      const { error } = await supabase
        .from('journal')
        .update({ is_deleted: true }) // <-- SET THE FLAG
        .eq('id', entry.id);

      if (error) throw error;
      setEntries(currentEntries => currentEntries.filter(e => e.id !== entry.id));
      toast({ title: 'Entry removed', status: 'success' });
    } catch (error) {
      console.error('Error removing entry:', error.message);
      toast({ title: 'Error removing entry', description: error.message, status: 'error' });
    }
  };

  // --- 5. DOWNLOAD IMAGE (New) ---
  const handleDownloadImage = async (entry) => {
    if (!entry.image_url) return;
    setDownloadingId(entry.id); 
    try {
      const response = await fetch(entry.image_url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = entry.image_url.split('/').pop() || 'journal-image.jpg';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      toast({ title: 'Download failed', description: err.message, status: 'error' });
    } finally {
      setDownloadingId(null);
    }
  };
  
  // --- LOADING STATE (Unchanged) ---
  if (loading) {
    return (
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg" textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  // --- RENDER (Updated) ---
  return (
    <VStack spacing={8} align="stretch">
      {/* --- "New Journal Entry" form (Unchanged) --- */}
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <form onSubmit={handleSubmit}>
         <VStack spacing={4}>
           <Heading size="md">New Journal Entry</Heading>
           <FormControl>
             <FormLabel>What's on your mind?</FormLabel>
             <Textarea
               placeholder="Write about your day, your goals, or a special memory..."
               value={entryText}
               onChange={(e) => setEntryText(e.target.value)}
               rows={5}
               required
             />
           </FormControl>
           <FormControl>
             <FormLabel>Add a photo (optional)</FormLabel>
             <Input
               type="file"
               accept="image/*"
               onChange={(e) => setFile(e.target.files[0])}
               p={1.5}
             />
           </FormControl>
           <Button
             type="submit"
             colorScheme="purple"
             width="full"
             isLoading={uploading}
             loadingText="Saving..."
           >
             Save Entry
           </Button>
         </VStack>
        </form>
      </Box>

      {/* --- "My Entries" section (Updated) --- */}
      <Box>
        <Heading size="lg" mb={4}>My Entries</Heading>
        {entries.length === 0 ? (
          <Text>You haven't written any entries yet.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {entries.map((entry) => {
              const entryDate = new Date(entry.created_at);
              return (
                <Box key={entry.id} p={5} bg={formBg} borderRadius="xl" boxShadow="md">
                  
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="sm" color="gray.500">
                      You wrote on {entryDate.toLocaleDateString()}
                      {' at '}
                      {entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    
                    <HStack spacing={2}>
                      <IconButton
                        icon={<IoSend />}
                        size="sm"
                        variant="ghost"
                        colorScheme="purple"
                        aria-label="Share memory"
                        onClick={() => handleShareClick(entry)}
                      />
                      <IconButton
                        icon={<DeleteIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        aria-label="Delete entry"
                        onClick={() => handleDeleteEntry(entry)}
                      />
                    </HStack>
                  </Flex>
                  
                  {entry.image_url && (
                    <Box position="relative" my={4}>
                      <Image src={entry.image_url} alt="Journal entry" borderRadius="md" />
                      <IconButton
                        icon={<DownloadIcon />}
                        position="absolute"
                        top="8px"
                        right="8px"
                        isRound
                        variant="solid"
                        colorScheme="blackAlpha"
                        aria-label="Download image"
                        onClick={() => handleDownloadImage(entry)}
                        isLoading={downloadingId === entry.id} 
                      />
                    </Box>
                  )}
                  <Text mt={2} whiteSpace="pre-wrap">{entry.text}</Text>
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

export default Journal;