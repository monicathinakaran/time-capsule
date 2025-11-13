// src/Pages/SharedBucketList.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js'; // Adjust path
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
  Avatar,
  useToast,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

const SharedBucketList = ({ session, capsuleId }) => {
  const [items, setItems] = useState([]);
  const [userMap, setUserMap] = useState({}); // To store user emails
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);
  const user = session.user;
  const formBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();

  // 1. Fetch items and user emails
  useEffect(() => {
    if (!capsuleId) return;

    const getItems = async () => {
      setLoading(true);

      // Step 1: Fetch items from the shared_bucket_list
      const { data: itemsData, error: itemsError } = await supabase
        .from('shared_bucket_list')
        .select('*')
        .eq('capsule_id', capsuleId)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('Error fetching items:', itemsError.message);
        toast({ title: 'Error fetching items', description: itemsError.message, status: 'error' });
        setLoading(false);
        return;
      }
      
      setItems(itemsData);

      // Step 2: Fetch profile emails for the users who added items
      const userIds = [...new Set(itemsData.map(e => e.user_id).filter(id => id))];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError.message);
        } else {
          const map = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile.email;
            return acc;
          }, {});
          setUserMap(map);
        }
      }
      
      setLoading(false);
    };
    getItems();
  }, [capsuleId]);

  // 2. Handle Add Item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemText) return;

    const { data, error } = await supabase
      .from('shared_bucket_list')
      .insert({
        text: newItemText,
        capsule_id: capsuleId,
        user_id: user.id, // Add the user's ID
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting item:', error);
      toast({ title: 'Error adding item', description: error.message, status: 'error' });
    } else if (data) {
      setItems([...items, data]); // Add to local state
      setUserMap({ ...userMap, [user.id]: user.email }); // Add self to map
      setNewItemText(''); // Clear form
    }
  };

  // 3. Handle Toggle Complete (no change in logic)
  const handleToggleComplete = async (id, is_complete) => {
    const { error } = await supabase
      .from('shared_bucket_list')
      .update({ is_complete: !is_complete })
      .eq('id', id);

    if (error) console.error('Error updating item:', error);
    else {
      setItems(items.map(item => item.id === id ? { ...item, is_complete: !is_complete } : item));
    }
  };
  
  // 4. Handle Delete Item (no change in logic)
  const handleDeleteItem = async (id) => {
    const { error } = await supabase
        .from('shared_bucket_list')
        .delete()
        .eq('id', id);

    if (error) console.error('Error deleting item:', error);
    else setItems(items.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg" textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <form onSubmit={handleAddItem}>
          <VStack spacing={4}>
            <Heading size="md">Add to the Shared Bucket List</Heading>
            <FormControl>
              <Input
                placeholder="e.g., Visit the Eiffel Tower"
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
        <Heading size="lg" mb={4}>Our List</Heading>
        {items.length === 0 ? (
          <Text>This bucket list is empty. Add something!</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {items.map((item) => {
              const email = userMap[item.user_id] || 'An invited user';
              return (
                <VStack key={item.id} align="stretch" p={3} borderWidth="1px" borderRadius="md">
                  <HStack justify="space-between">
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
                  <HStack>
                    <Avatar name={email} size="xs" />
                    <Text fontSize="xs" color="gray.500">
                      Added by {email}
                    </Text>
                  </HStack>
                </VStack>
              );
            })}
          </VStack>
        )}
      </Box>
    </VStack>
  );
};

export default SharedBucketList;