// src/Pages/components/ViewItemModal.jsx
import {
  Modal, ModalOverlay, ModalContent, ModalHeader,
  ModalBody, ModalCloseButton, Button, Text, Spinner,
  VStack, Box, useColorModeValue, Image
} from '@chakra-ui/react';
import { DownloadIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabase_client.js';
import { useState, useEffect } from 'react';

export const ViewItemModal = ({ isOpen, onClose, item }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  
  const noteBg = useColorModeValue('white', 'gray.700');
  const contentBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    // ... (This useEffect fetch logic is unchanged) ...
    const fetchItemContent = async () => {
      if (!item) return;
      setLoading(true);
      setError('');
      setContent(null);
      const tableName = item.item_type === 'letter' ? 'future_letters' : 'journal';
      const selectColumns = item.item_type === 'journal' 
        ? 'text, image_url' 
        : 'text';
      const { data, error } = await supabase
        .from(tableName)
        .select(selectColumns)
        .eq('id', item.source_item_id)
        .single();
      if (error) {
        console.error('Error fetching item content:', error);
        setError('Could not load the item content.');
      } else {
        setContent(data);
      }
      setLoading(false);
    };
    if (isOpen) {
      fetchItemContent();
    }
  }, [item, isOpen]);

  // --- (Download handler function is unchanged) ---
  const handleDownload = async () => {
    if (!content.image_url) return;
    setIsDownloading(true);
    try {
      const response = await fetch(content.image_url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = content.image_url.split('/').pop() || 'shared-image.jpg';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Shared {item?.item_type === 'letter' ? 'Letter' : 'Journal Entry'}
        </ModalHeader>
        <ModalCloseButton /> 
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Sender's Note Box (unchanged) */}
            {item?.personal_note && (
              <Box 
                bg={noteBg} 
                p={4} 
                borderRadius="md" 
                borderWidth="1px" 
                borderColor="purple.200"
                boxShadow="sm"
              >
                <Text fontWeight="bold">Sender's Note:</Text>
                <Text as="em">"{item.personal_note}"</Text>
              </Box>
            )}

            {/* Content Box (Updated) */}
            <Box>
              <Text fontWeight="bold" mb={2}>Content:</Text>
              {loading && <Spinner />}
              {error && <Text color="red.500">{error}</Text>}
              {content && (
                <Box 
                  bg={contentBg} 
                  p={4} 
                  borderRadius="md" 
                  borderWidth="1px" 
                  borderColor="gray.200"
                  boxShadow="sm"
                >
                  {/* --- 1. IMAGE (Button is no longer here) --- */}
                  {content.image_url && (
                    <Image 
                      src={content.image_url} 
                      alt="Shared journal image" 
                      borderRadius="md" 
                      mb={4}
                      maxH="400px"
                      objectFit="contain"
                    />
                  )}
                  
                  {/* --- 2. TEXT --- */}
                  <Text whiteSpace="pre-wrap">
                    {content.text}
                  </Text>
                  
                  {/* --- 3. DOWNLOAD BUTTON (Moved here) --- */}
                  {/* It will only render if an image_url exists */}
                  {content.image_url && (
                    <Button
                      mt={4} // Add margin-top to separate it from the text
                      colorScheme="purple"
                      variant="outline"
                      leftIcon={<DownloadIcon />}
                      onClick={handleDownload}
                      isLoading={isDownloading}
                      loadingText="Downloading..."
                    >
                      Download Image
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </VStack>
        </ModalBody>
        
        {/* Adds padding at the bottom */}
        <Box h="1.5rem" /> 

      </ModalContent>
    </Modal>
  );
};