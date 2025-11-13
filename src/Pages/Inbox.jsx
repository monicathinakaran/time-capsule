// src/Pages/components/Inbox.jsx
import { supabase } from '../supabase_client.js';
import { useState, useEffect } from 'react';
import {
  Box, Text, Spinner, Button, VStack,
  useDisclosure, Container, useColorModeValue,
  Tabs, TabList, Tab, TabPanels, TabPanel,
  // 1. --- ADD THESE IMPORTS ---
  IconButton, useToast, HStack, Flex, Spacer
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons'; // 2. --- ADD THIS IMPORT ---
import Navbar from './components/nav_bar.jsx';
import { ViewItemModal } from './components/ViewItemModal.jsx'; 

// ----- InboxItem Sub-Component (Updated) -----
// 3. --- ADD 'onDeleteItem' PROP ---
function InboxItem({ item, view, onViewClick, onDeleteItem }) {
  const isLetter = item.item_type === 'letter';
  const isLocked = isLetter && item.unlock_date && new Date(item.unlock_date) > new Date();
  const otherPersonEmail = view === 'received' ? item.sender?.email : item.recipient?.email;
  const otherPersonLabel = view === 'received' ? 'From:' : 'To:';

  const handleDelete = () => {
    // Show a confirmation before deleting
    if (window.confirm('Are you sure you want to remove this item from your inbox?')) {
      onDeleteItem(item);
    }
  };

  return (
    <Box border="1px solid #ccc" p={4} m={2} borderRadius="md" bg="white">
      <Text fontWeight="bold">{otherPersonLabel} {otherPersonEmail || '...'}</Text>
      <Text><strong>Type:</strong> {item.item_type}</Text>
      {item.personal_note && (
        <Text as="em" color="gray.600" mt={2}>
          "{item.personal_note}"
        </Text>
      )}
      
      {/* 4. --- GROUP BUTTONS WITH FLEX --- */}
      <HStack spacing={2} mt={4}>
        {isLocked ? (
          <Box>
            <Text fontWeight="bold" color="gray.500">[LOCKED]</Text>
            <Text>Unlocks on: {new Date(item.unlock_date).toLocaleDateString()}</Text>
          </Box>
        ) : (
          <Button 
            size="sm" 
            colorScheme="purple"
            onClick={() => onViewClick(item)}
          >
            View Item
          </Button> 
        )}
        
        <Spacer /> 

        <IconButton
          icon={<DeleteIcon />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          aria-label="Delete item"
          onClick={handleDelete} // 5. --- ADD ONCLICK ---
        />
      </HStack>
      
      <Text fontSize="xs" color="gray.400" mt={2}>
        Sent: {new Date(item.created_at).toLocaleString()}
      </Text>
    </Box>
  );
}

// ----- Main Inbox Component (Updated) -----
export default function Inbox({ session }) {
  const user = session?.user;
  const [view, setView] = useState('received'); 
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedItem, setSelectedItem] =useState(null);
  const cardBg = useColorModeValue('white', 'gray.700');
  const toast = useToast(); // 6. --- ADD TOAST ---

  useEffect(() => {
    const fetchItems = async () => {
      if (!user) return;
      setLoading(true);
      
      const queryColumn = view === 'received' ? 'recipient_id' : 'sender_id';
      // 7. --- ADD DELETE COLUMN LOGIC ---
      const deleteColumn = view === 'received' ? 'recipient_deleted' : 'sender_deleted';

      const { data, error } = await supabase
        .from('shared_items')
        .select(`*, sender:sender_id ( email ), recipient:recipient_id ( email )`)
        .eq(queryColumn, user.id)
        .eq(deleteColumn, false) // 8. --- ADD THIS LINE TO HIDE DELETED ITEMS ---
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching inbox:', error);
      } else {
        setItems(data);
      }
      setLoading(false);
    };
    fetchItems();
  }, [user, view]); // This hook re-runs when 'view' changes

  const handleViewClick = (item) => {
    setSelectedItem(item);
    onOpen();
  };
  
  // 9. --- ADD DELETE HANDLER FUNCTION ---
  const handleDeleteItem = async (item) => {
    const columnToUpdate = view === 'sent' ? 'sender_deleted' : 'recipient_deleted';

    try {
      const { error } = await supabase
        .from('shared_items')
        .update({ [columnToUpdate]: true }) // Set the flag to true
        .eq('id', item.id);
      
      if (error) throw error;

      // Remove the item from the list instantly for a fast UI
      setItems(currentItems => currentItems.filter(i => i.id !== item.id));
      
      toast({
        title: 'Item removed.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Error removing item.',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // --- Handlers for the Tabs (unchanged) ---
  const handleTabChange = (index) => {
    if (index === 0) {
      setView('received');
    } else {
      setView('sent');
    }
  };
  const tabIndex = view === 'received' ? 0 : 1;

  // --- RETURN STATEMENT (Updated) ---
  return (
    <Box>
      <Navbar />
      <Box 
        bgGradient="linear(to-br, teal.100, purple.200)"
        minH="100vh"
        pt={16}
      >
        <Container maxW="container.lg" py={12}> 
          <Tabs 
            index={tabIndex}
            onChange={handleTabChange}
            isFitted 
            variant="enclosed" 
            colorScheme="purple"
          >
            <TabList mb="1em" bg="whiteAlpha.700" borderRadius="lg">
              <Tab _selected={{ color: 'white', bg: 'purple.600' }}>Received</Tab>
              <Tab _selected={{ color: 'white', bg: 'purple.600' }}>Sent</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel p={0}>
                <Box
                  bg={cardBg}
                  p={{ base: 4, md: 8 }}
                  borderRadius="xl"
                  boxShadow="lg"
                >
                  {loading && <Spinner />}
                  {!loading && items.length === 0 && (
                    <Text>Your '{view}' box is empty.</Text>
                  )}
                  {!loading && (
                    <VStack spacing={4} align="stretch">
                      {items.map((item) => (
                        <InboxItem 
                          key={item.id} 
                          item={item} 
                          view={view} 
                          onViewClick={handleViewClick}
                          onDeleteItem={handleDeleteItem} // 10. --- PASS PROP ---
                        />
                      ))}
                    </VStack>
                  )}
                </Box>
              </TabPanel>
              
              <TabPanel p={0}>
                <Box
                    bg={cardBg}
                    p={{ base: 4, md: 8 }}
                    borderRadius="xl"
                    boxShadow="lg"
                  >
                    {loading && <Spinner />}
                    {!loading && items.length === 0 && (
                      <Text>Your '{view}' box is empty.</Text>
                    )}
                    {!loading && (
                      <VStack spacing={4} align="stretch">
                        {items.map((item) => (
                          <InboxItem 
                            key={item.id} 
                            item={item} 
                            view={view} 
                            onViewClick={handleViewClick}
                            onDeleteItem={handleDeleteItem} // 10. --- PASS PROP ---
                          />
                        ))}
                      </VStack>
                    )}
                  </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>

      {/* The modal stays at the end */}
      {selectedItem && (
        <ViewItemModal 
          isOpen={isOpen} 
          onClose={onClose} 
          item={selectedItem} 
        />
      )}
    </Box>
  );
}