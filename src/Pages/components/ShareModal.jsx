// src/Pages/components/ShareModal.jsx

import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, Input, Textarea,
  VStack, Text, useToast
} from '@chakra-ui/react';
// This is the correct import for your project
import { supabase } from '../../supabase_client.js'; 
import { useState } from 'react';

export const ShareModal = ({ session, isOpen, onClose, itemToShare }) => {
  const toast = useToast();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!recipientEmail) {
      toast({ title: 'Please enter a recipient email.', status: 'error' });
      return;
    }
    setLoading(true);

    try {
      // This now correctly uses the 'supabase' client you imported
      const { data, error } = await supabase.functions.invoke('share-item', {
        body: {
          recipientEmail: recipientEmail,
          source_item_id: itemToShare.id, 
          item_type: itemToShare.item_type,
          unlock_date: itemToShare.unlock_date,
          personal_note: note,
        },
      });

      if (error) throw error;

      toast({ title: 'Shared successfully!', status: 'success' });
      setRecipientEmail(''); 
      setNote('');
      onClose(); 
      
    } catch (error) {
      toast({ 
        title: `Error: ${error.message}`, 
        status: 'error', 
        duration: 5000, 
        isClosable: true 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRecipientEmail('');
    setNote('');
    onClose();
  };

  // Your <Textarea> had a small typo (targe.value) - I've fixed it to (e.target.value)
  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Share this Item</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {itemToShare?.item_type === 'journal' && (
              <Text>You are sharing a journal entry.</Text>
            )}
            
            <Input 
              placeholder="Recipient's email" 
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
            <Textarea 
              placeholder="Add a personal note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)} // <-- Typo fixed
            />
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="purple" 
            onClick={handleShare} 
            isLoading={loading}
          >
            Send
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};