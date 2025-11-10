// src/Pages/BucketList.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js';
import {
  Box,
  Button,
  FormControl,
  Input,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Spinner,
  HStack,
  Checkbox,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

const BucketList = ({ session }) => {
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const user = session.user;
  const formBg = useColorModeValue('white', 'gray.700');

  // 1. Fetch items from DB
  useEffect(() => {
    const getItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('bucket_list')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching items:', error);
      else setItems(data);
      setLoading(false);
    };
    getItems();
  }, [user.id]);

  // 2. Handle Add Item (MODIFIED)
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText) return;

    // Call insert and use .select() to get the new row back
    const { data, error } = await supabase
      .from('bucket_list')
      .insert({ text: newItemText, user_id: user.id })
      .select() // This is the key change!
      .single(); // We're only expecting one new row

    if (error) {
      console.error('Error inserting item:', error);
    } else if (data) {
      // Add the new item (data) to our local 'items' state
      setItems([...items, data]);
      setNewItemText(''); // Clear the form
      // We removed window.location.reload()
    }
  };

  // 3. Handle Toggle Complete
  const handleToggleComplete = async (id, is_complete) => {
    const { error } = await supabase
      .from('bucket_list')
      .update({ is_complete: !is_complete })
      .eq('id', id);

    if (error) console.error('Error updating item:', error);
    else {
      setItems(items.map(item => item.id === id ? { ...item, is_complete: !is_complete } : item));
    }
  };
  
  // 4. Handle Delete Item
  const handleDeleteItem = async (id) => {
    const { error } = await supabase
        .from('bucket_list')
        .delete()
        .eq('id', id);

    if (error) console.error('Error deleting item:', error);
    else setItems(items.filter(item => item.id !== id));
  };

  return (
    <VStack spacing={8} align="stretch">
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <form onSubmit={handleAddItem}>
          <VStack spacing={4}>
            <Heading size="md">Add to Your Bucket List</Heading>
            <FormControl>
              <Input
                placeholder="e.g., Learn to play guitar"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                required
              />
            </FormControl>
            <Button type="submit" colorScheme="purple" width="full">
              Add Item
            </Button>
          </VStack>
        </form>
      </Box>

      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={4}>My List</Heading>
        {loading ? (
          <Spinner size="xl" />
        ) : items.length === 0 ? (
          <Text>Your bucket list is empty. Add something!</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {items.map((item) => (
              <HStack key={item.id} justify="space-between">
                <Checkbox
                  colorScheme="purple"
                  isChecked={item.is_complete}
                  onChange={() => handleToggleComplete(item.id, item.is_complete)}
                >
                  <Text as={item.is_complete ? 's' : ''} fontSize="lg">
                    {item.text}
                  </Text>
                </Checkbox>
                <IconButton
                  icon={<DeleteIcon />}
                  isRound
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => handleDeleteItem(item.id)}
                />
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default BucketList;