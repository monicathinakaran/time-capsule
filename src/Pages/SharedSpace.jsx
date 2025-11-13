// src/Pages/SharedSpace.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  Container,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Select,
  Text,
  Spinner,
  VStack,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Checkbox,
  SimpleGrid,
  HStack,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  IconButton,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';
import Navbar from './components/nav_bar.jsx'; // Make sure this path is correct
import { supabase } from '../supabase_client.js';
import InviteModal from './components/InviteModal.jsx'; 
import SharedJournal from './SharedJournal.jsx';
import SharedBucketList from './SharedBucketList.jsx';
import SharedFutureLetters from './SharedFutureLetters.jsx';
import SharedFavorites from './SharedFavorites.jsx'; // 1. Import new component

const SharedSpace = ({ session }) => {
  // ... (All your state and functions remain exactly the same) ...
  const [allSharedCapsules, setAllSharedCapsules] = useState([]);
  const [selectedCapsuleId, setSelectedCapsuleId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newCapsuleName, setNewCapsuleName] = useState('');
  const [hasJournal, setHasJournal] = useState(true);
  const [hasBucketList, setHasBucketList] = useState(true);
  const [hasFutureLetters, setHasFutureLetters] = useState(true);
  const [hasFavorites, setHasFavorites] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();
  const user = session.user;
  const { isOpen: isInviteModalOpen, onOpen: onInviteModalOpen, onClose: onInviteModalClose } = useDisclosure();
  const [capsuleToInvite, setCapsuleToInvite] = useState(null);
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const [actionToConfirm, setActionToConfirm] = useState(null);
  const cancelRef = useRef();
  const selectedCapsule = allSharedCapsules.find(
    (c) => c.id === parseInt(selectedCapsuleId)
  );
  useEffect(() => {
    const getCapsules = async () => {
      setLoading(true);
      const { data: memberCapsules, error: memberError } = await supabase
        .from('shared_capsules')
        .select(`id, name, owner_id, has_journal, has_bucket_list, has_future_letters, has_favorites`)
        .order('created_at', { ascending: false });
      if (memberError) console.error('Error fetching shared capsules:', memberError);
      else {
        setAllSharedCapsules(memberCapsules);
        if (memberCapsules && memberCapsules.length > 0) setSelectedCapsuleId(memberCapsules[0].id);
      }
      setLoading(false);
    };
    getCapsules();
  }, [user.id]);
  const handleCreateCapsule = async (e) => {
    e.preventDefault();
    if (!newCapsuleName) return;
    if (!hasJournal && !hasBucketList && !hasFutureLetters && !hasFavorites) {
      toast({ title: 'At least one feature is required', status: 'warning' });
      return;
    }
    setIsCreating(true);
    try {
      const { data: capsuleData, error: capsuleError } = await supabase
        .from('shared_capsules')
        .insert({
          name: newCapsuleName, owner_id: user.id, has_journal: hasJournal,
          has_bucket_list: hasBucketList, has_future_letters: hasFutureLetters, has_favorites: hasFavorites,
        })
        .select('*')
        .single();
      if (capsuleError) throw capsuleError;
      const { error: memberError } = await supabase
        .from('shared_capsule_members')
        .insert({ capsule_id: capsuleData.id, user_id: user.id });
      if (memberError) throw memberError;
      setNewCapsuleName('');
      setAllSharedCapsules([capsuleData, ...allSharedCapsules]);
      setSelectedCapsuleId(capsuleData.id);
      toast({ title: 'Capsule created!', status: 'success' });
    } catch (error) {
      if (error.message && error.message.includes('owner_id_name_unique')) {
        toast({ title: 'Duplicate Name', description: 'A capsule with that name already exists.', status: 'error' });
      } else {
        toast({ title: 'Error creating capsule', description: error.message, status: 'error' });
      }
    } finally {
      setIsCreating(false);
    }
  };
  const handleInviteClick = (capsule) => {
    setCapsuleToInvite(capsule);
    onInviteModalOpen();
  };
  const handleDeleteClick = (capsule) => {
    setActionToConfirm({ type: 'delete', capsule });
    onAlertOpen();
  };
  const handleLeaveClick = (capsule) => {
    setActionToConfirm({ type: 'leave', capsule });
    onAlertOpen();
  };
  const handleConfirmAction = async () => {
    if (!actionToConfirm) return;
    const { type, capsule } = actionToConfirm;
    try {
      if (type === 'delete') {
        const { error } = await supabase.from('shared_capsules').delete().eq('id', capsule.id);
        if (error) throw error;
        toast({ title: 'Capsule Deleted', status: 'success' });
      } else if (type === 'leave') {
        const { error } = await supabase.from('shared_capsule_members').delete().eq('capsule_id', capsule.id).eq('user_id', user.id);
        if (error) throw error;
        toast({ title: 'You have left the capsule', status: 'success' });
      }
      setAllSharedCapsules(allSharedCapsules.filter(c => c.id !== capsule.id));
      setActionToConfirm(null);
      onAlertClose();
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error' });
      onAlertClose();
    }
  };
  if (loading) {
    // ... (loading spinner)
    return (
      <Box>
        <Navbar />
        <Box bgGradient="linear(to-br, teal.100, purple.200)" minH="100vh" pt={16} display="flex" alignItems="center" justifyContent="center">
          <Spinner size="xl" color="white" />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Navbar />
      <Box 
        bgGradient="linear(to-br, teal.100, purple.200)"
        minH="100vh"
        pt={16}
      >
        <Container maxW="container.lg" py={12}>
          <VStack spacing={8} align="stretch">
          
            {/* Create Capsule Form (unchanged) */}
            <Box p={8} bg="white" borderRadius="xl" boxShadow="lg">
              {/* ... form ... */}
              <form onSubmit={handleCreateCapsule}>
                <VStack spacing={4}>
                  <Heading size="md">Create a New Shared Capsule</Heading>
                  <FormControl isRequired>
                    <FormLabel>Capsule Name</FormLabel>
                    <Input placeholder="e.g., Family Trip 2026" value={newCapsuleName} onChange={(e) => setNewCapsuleName(e.target.value)} />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Select Features for this Capsule:</FormLabel>
                    <SimpleGrid columns={2} spacing={4}>
                      <Checkbox isChecked={hasJournal} onChange={(e) => setHasJournal(e.target.checked)}>Journal</Checkbox>
                      <Checkbox isChecked={hasBucketList} onChange={(e) => setHasBucketList(e.target.checked)}>Bucket List</Checkbox>
                      <Checkbox isChecked={hasFutureLetters} onChange={(e) => setHasFutureLetters(e.target.checked)}>Future Letters</Checkbox>
                      <Checkbox isChecked={hasFavorites} onChange={(e) => setHasFavorites(e.target.checked)}>Favorites</Checkbox>
                    </SimpleGrid>
                  </FormControl>
                  <Button type="submit" colorScheme="purple" width="full" isLoading={isCreating}>Create Capsule</Button>
                </VStack>
              </form>
            </Box>
            
            {/* Manage Capsules (unchanged) */}
            <Box p={8} bg="white" borderRadius="xl" boxShadow="lg">
              {/* ... list ... */}
              <Heading size="md" mb={4}>Manage Your Capsules</Heading>
              {allSharedCapsules.length === 0 ? (
                <Text>You have no shared capsules. Create one above to get started!</Text>
              ) : (
                <VStack spacing={4} align="stretch">
                  {allSharedCapsules.map((capsule) => (
                    <HStack key={capsule.id} justify="space-between" p={4} borderWidth="1px" borderRadius="lg">
                      <Text fontWeight="bold">{capsule.name}</Text>
                      <HStack>
                        {capsule.owner_id === user.id ? (
                          <>
                            <Button colorScheme="purple" onClick={() => handleInviteClick(capsule)}>Invite</Button>
                            <IconButton icon={<DeleteIcon />} colorScheme="red" variant="outline" onClick={() => handleDeleteClick(capsule)} />
                          </>
                        ) : (
                          <Button colorScheme="red" variant="ghost" onClick={() => handleLeaveClick(capsule)}>Leave Capsule</Button>
                        )}
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Box>

            {/* View Shared Capsule (unchanged) */}
            <Box p={8} bg="white" borderRadius="xl" boxShadow="lg">
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="gray.700">View Selected Capsule:</Heading>
                {allSharedCapsules.length === 0 ? (
                  <Text>No capsules to view.</Text>
                ) : (
                  <Select bg="white" boxShadow="sm" value={selectedCapsuleId} onChange={(e) => setSelectedCapsuleId(e.target.value)}>
                    {allSharedCapsules.map((capsule) => (<option key={capsule.id} value={capsule.id}>{capsule.name}</option>))}
                  </Select>
                )}
              </VStack>

              {selectedCapsuleId && (
                <Tabs isFitted variant="unstyled" colorScheme="purple" mt={6}>
                  <TabList mb="1em" bg="gray.100" borderRadius="lg">
                    {selectedCapsule?.has_journal && (
                      <Tab _selected={{ color: 'purple.600', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'purple.600' }}>Journal</Tab>
                    )}
                    {selectedCapsule?.has_bucket_list && (
                      <Tab _selected={{ color: 'purple.6600', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'purple.600' }}>Bucket List</Tab>
                    )}
                    {selectedCapsule?.has_future_letters && (
                      <Tab _selected={{ color: 'purple.600', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'purple.600' }}>Future Letters</Tab>
                    )}
                    {selectedCapsule?.has_favorites && (
                      <Tab _selected={{ color: 'purple.600', fontWeight: 'bold', borderBottom: '2px solid', borderColor: 'purple.600' }}>Favorites</Tab>
                    )}
                  </TabList>
                  
                  {/* 2. PLUG IN THE NEW COMPONENT */}
                  <TabPanels>
                    {selectedCapsule?.has_journal && (
                      <TabPanel p={0}>
                        <SharedJournal session={session} capsuleId={selectedCapsuleId} />
                      </TabPanel>
                    )}
                    {selectedCapsule?.has_bucket_list && (
                      <TabPanel p={0}>
                        <SharedBucketList session={session} capsuleId={selectedCapsuleId} />
                      </TabPanel>
                    )}
                    {selectedCapsule?.has_future_letters && (
                      <TabPanel p={0}>
                        <SharedFutureLetters session={session} capsuleId={selectedCapsuleId} />
                      </TabPanel>
                    )}
                    {selectedCapsule?.has_favorites && (
                      <TabPanel p={0}>
                        <SharedFavorites session={session} capsuleId={selectedCapsuleId} />
                      </TabPanel>
                    )}
                  </TabPanels>
                </Tabs>
              )}
            </Box>
            
          </VStack>
        </Container>
      </Box>

      {/* Modals (unchanged) */}
      {capsuleToInvite && (
        <InviteModal
          session={session}
          isOpen={isInviteModalOpen}
          onClose={onInviteModalClose}
          capsuleId={capsuleToInvite.id}
          capsuleName={capsuleToInvite.name}
        />
      )}
      {actionToConfirm && (
        <AlertDialog
          isOpen={isAlertOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => setActionToConfirm(null)}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                {actionToConfirm.type === 'delete' ? 'Delete Capsule' : 'Leave Capsule'}
              </AlertDialogHeader>
              <AlertDialogBody>
                {actionToConfirm.type === 'delete'
                  ? `Are you sure you want to delete "${actionToConfirm.capsule.name}"? This action cannot be undone and will delete all contents for all members.`
                  : `Are you sure you want to leave "${actionToConfirm.capsule.name}"? You will lose access unless you are invited back.`}
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setActionToConfirm(null)}>Cancel</Button>
                <Button colorScheme="red" onClick={handleConfirmAction} ml={3}>
                  {actionToConfirm.type === 'delete' ? 'Delete' : 'Leave'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </Box>
  );
};

export default SharedSpace;