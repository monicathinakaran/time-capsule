// src/Pages/Journal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Textarea,
  Input,
  VStack,
  Heading,
  Text,
  Image,
  useColorModeValue,
  Spinner,
} from '@chakra-ui/react';
import { v4 as uuidv4 } from 'uuid'; // Install uuid: npm install uuid

const Journal = ({ session }) => {
  const [entries, setEntries] = useState([]);
  const [entryText, setEntryText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const user = session.user;

  const formBg = useColorModeValue('white', 'gray.700');
  const brandColor = useColorModeValue('purple.600', 'purple.300');

  // Fetch entries from DB
  useEffect(() => {
    const getEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('journal')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching entries:', error);
      else setEntries(data);
      setLoading(false);
    };
    getEntries();
  }, [user.id]);

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    let imageUrl = null;

    if (file) {
      const filePath = `${user.id}/${uuidv4()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('journal-images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from('journal-images')
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error: insertError } = await supabase
      .from('journal')
      .insert({
        text: entryText,
        user_id: user.id,
        image_url: imageUrl,
      });

    if (insertError) {
      console.error('Error inserting entry:', insertError);
    } else {
      setEntryText('');
      setFile(null);
      // Simple refresh to show new post
      window.location.reload(); 
    }
    setUploading(false);
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* 1. New Entry Form */}
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
                p={1.5} // Style the file input
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

      {/* 2. List of Past Entries */}
      <Box>
        <Heading size="lg" mb={4}>My Entries</Heading>
        {loading ? (
          <Spinner size="xl" />
        ) : entries.length === 0 ? (
          <Text>You haven't written any entries yet.</Text>
        ) : (
          <VStack spacing={6} align="stretch">
            {entries.map((entry) => (
              <Box key={entry.id} p={5} bg={formBg} borderRadius="xl" boxShadow="md">
                <Text fontSize="sm" color="gray.500">
                  {new Date(entry.created_at).toLocaleString()}
                </Text>
                {entry.image_url && (
                  <Image src={entry.image_url} alt="Journal entry" borderRadius="md" my={4} />
                )}
                <Text mt={2}>{entry.text}</Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default Journal;