// src/Pages/components/InviteModal.jsx
import React, { useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
  VStack,
} from '@chakra-ui/react';
// Make sure this path is correct
import { supabase } from '../../supabase_client.js'; 
import emailjs from '@emailjs/browser';

const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;

const InviteModal = ({ session, isOpen, onClose, capsuleId, capsuleName }) => {
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const toast = useToast();

  const handleSendInvite = async () => {
    if (!email) {
      toast({ title: 'Email required', status: 'warning' });
      return;
    }
    
    setIsInviting(true);
    try {
      // 1. Find the user's ID
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
        
      if (userError || !userData) {
        throw new Error('User not found with that email. Please check the spelling.');
      }
      
      const userToInviteId = userData.id;

      // 2. Add user to the capsule
      const { error: memberError } = await supabase
        .from('shared_capsule_members')
        .insert({
          capsule_id: capsuleId,
          user_id: userToInviteId
        });
      
      if (memberError) {
        if (memberError.code === '23505') {
          throw new Error('This user is already a member of this capsule.');
        } else {
          throw memberError;
        }
      }

      // 3. --- NEW: SEND EMAIL ---
      const templateParams = {
        inviter_email: session.user.email,
        capsule_name: capsuleName,
        to_email: email
      };
      
      emailjs.send(
        'default_service',
        EMAILJS_TEMPLATE_ID, 
        templateParams, 
        EMAILJS_PUBLIC_KEY
      ).then((res) => {
          console.log("EmailJS Success:", res.status, res.text);
      }).catch((err) => {
          console.error("EmailJS Failed:", err);
          toast({
            title: 'Invite sent, but email failed',
            description: 'The user was added, but the notification email failed to send.',
            status: 'warning',
          });
      });

      // 4. Success!
      toast({
        title: 'Invite Sent!',
        description: `${email} has been added to "${capsuleName}".`,
        status: 'success',
      });
      setEmail('');
      onClose();

    } catch (error) {
      // 5. Error handling
      toast({
        title: 'Error Sending Invite',
        description: error.message,
        status: error.message.includes('already a member') ? 'warning' : 'error',
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Invite to "{capsuleName}"</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>User's Email</FormLabel>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                // --- THIS IS THE FIX ---
                onChange={(e) => setEmail(e.target.value)} // Removed the "e.g."
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="purple"
            isLoading={isInviting}
            onClick={handleSendInvite}
          >
            Send Invite
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InviteModal;