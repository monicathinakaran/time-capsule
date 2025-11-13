// src/Pages/SharedFavorites.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js'; // Adjust path
import axios from 'axios';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useColorModeValue,
  Spinner,
  HStack,
  SimpleGrid,
  Image,
  useToast,
  Textarea,
  CloseButton,
  Select,
  Avatar,
  IconButton,
  Flex, // Import Flex
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

const SharedFavorites = ({ session, capsuleId }) => {
  const [favorites, setFavorites] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [searchCategory, setSearchCategory] = useState('Movie');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedItem, setSelectedItem] = useState(null);
  const [comments, setComments] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const user = session.user;
  const formBg = useColorModeValue('white', 'gray.700');
  const toast = useToast();

  useEffect(() => {
    if (!capsuleId) return;
    const getFavorites = async () => {
      setLoading(true);
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('shared_favorites')
        .select('*')
        .eq('capsule_id', capsuleId)
        .order('created_at', { ascending: false });
      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError.message);
        toast({ title: 'Error fetching favorites', description: favoritesError.message, status: 'error' });
        setLoading(false);
        return;
      }
      setFavorites(favoritesData);
      const userIds = [...new Set(favoritesData.map(e => e.user_id).filter(id => id))];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);
        if (profilesError) console.error('Error fetching profiles:', profilesError.message);
        else {
          const map = profilesData.reduce((acc, profile) => {
            acc[profile.id] = profile.email;
            return acc;
          }, {});
          setUserMap(map);
        }
      }
      setLoading(false);
    };
    getFavorites();
  }, [capsuleId, toast]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedItem(null);
    try {
      let response;
      if (searchCategory === 'Movie') {
        response = await axios.get(`https://api.themoviedb.org/3/search/movie`, { params: { api_key: TMDB_API_KEY, query: searchQuery } });
        setSearchResults(response.data.results);
      } else if (searchCategory === 'Book') {
        response = await axios.get(`https://www.googleapis.com/books/v1/volumes`, { params: { q: searchQuery, key: GOOGLE_BOOKS_API_KEY } });
        setSearchResults(response.data.items || []);
      } else if (searchCategory === 'Song') {
        const { data, error } = await supabase.functions.invoke('search-genius', { body: { query: searchQuery } });
        if (error) throw error;
        setSearchResults(data.response.hits || []);
      }
    } catch (error) {
      console.error(`Error searching ${searchCategory}s:`, error);
      toast({ title: `Error searching ${searchCategory}s.`, status: 'error' });
    }
    setIsSearching(false);
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery('');
    setSearchResults([]);
    setComments('');
  };

  const handleAddFavorite = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSaving(true);
    let newFavorite;
    if (searchCategory === 'Movie') {
      newFavorite = { category: 'Movie', title: selectedItem.title, notes: comments, image_url: `https://image.tmdb.org/t/p/w500${selectedItem.poster_path}`, capsule_id: capsuleId, user_id: user.id };
    } else if (searchCategory === 'Book') {
      newFavorite = { category: 'Book', title: selectedItem.volumeInfo.title, notes: comments, image_url: selectedItem.volumeInfo.imageLinks?.thumbnail || null, capsule_id: capsuleId, user_id: user.id };
    } else if (searchCategory === 'Song') {
      const song = selectedItem.result;
      newFavorite = { category: 'Song', title: `${song.title} - ${song.artist_names}`, notes: comments, image_url: song.song_art_image_thumbnail_url || null, capsule_id: capsuleId, user_id: user.id };
    }
    const { data, error } = await supabase.from('shared_favorites').insert(newFavorite).select().single();
    if (error) {
      console.error('Error inserting favorite:', error);
      toast({ title: 'Error saving favorite.', status: 'error' });
    } else {
      setFavorites([data, ...favorites]);
      setUserMap({ ...userMap, [user.id]: user.email });
      toast({ title: 'Favorite added!', status: 'success' });
      setSelectedItem(null);
      setComments('');
    }
    setIsSaving(false);
  };
  
  const changeCategory = (e) => {
    setSearchCategory(e.target.value);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
  };

  const handleDeleteFavorite = async (itemId) => {
    try {
      const { error } = await supabase
        .from('shared_favorites')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      setFavorites(favorites.filter(item => item.id !== itemId));
      toast({ title: 'Favorite removed', status: 'success', duration: 3000 });

    } catch (error) {
      console.error('Error deleting favorite:', error.message);
      toast({ title: 'Error removing favorite', description: error.message, status: 'error' });
    }
  };

  if (loading) {
    return (
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg" textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  // This is the full, correct component layout
  return (
    <VStack spacing={8} align="stretch">
      
      {/* --- CHOOSE CATEGORY AND SEARCH --- */}
      {!selectedItem && (
        <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
          <form onSubmit={handleSearch}>
            <VStack spacing={4}>
              <Heading size="md">Add a Shared Favorite</Heading>
              
              <FormControl>
                <FormLabel>Category</FormLabel>
                <Select value={searchCategory} onChange={changeCategory}>
                  <option value="Movie">Movie</option>
                  <option value="Book">Book</option>
                  <option value="Song">Song</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Search Term</FormLabel>
                <Input
                  placeholder={
                    searchCategory === 'Movie' ? 'e.g., Inception' :
                    searchCategory === 'Book' ? 'e.g., Dune' :
                    'e.g., Blinding Lights'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </FormControl>
              
              <Button type="submit" colorScheme="purple" width="full" isLoading={isSearching}>
                Search {searchCategory}s
              </Button>
            </VStack>
          </form>
          
          {/* --- SEARCH RESULTS --- */}
          {searchResults.length > 0 && (
            <VStack align="stretch" mt={6}>
              <Heading size="sm">Search Results</Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {searchCategory === 'Movie' && searchResults.map((movie) => (
                  <Box key={movie.id} p={2} borderWidth="1px" borderRadius="lg" cursor="pointer"
                       _hover={{ shadow: 'md', borderColor: 'purple.500' }}
                       onClick={() => handleSelectItem(movie)}>
                    <HStack>
                      <Image src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`} 
                             alt={movie.title} boxSize="75px" objectFit="cover" borderRadius="md" />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{movie.title}</Text>
                        <Text fontSize="sm">({movie.release_date?.split('-')[0]})</Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
                
                {searchCategory === 'Book' && searchResults.map((book) => (
                  <Box key={book.id} p={2} borderWidth="1px" borderRadius="lg" cursor="pointer"
                       _hover={{ shadow: 'md', borderColor: 'purple.500' }}
                       onClick={() => handleSelectItem(book)}>
                    <HStack>
                      <Image src={book.volumeInfo.imageLinks?.thumbnail || ''} 
                             alt={book.volumeInfo.title} boxSize="75px" objectFit="cover" borderRadius="md" />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" noOfLines={2}>{book.volumeInfo.title}</Text>
                        <Text fontSize="sm">({book.volumeInfo.publishedDate?.split('-')[0]})</Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}

                {searchCategory === 'Song' && searchResults.map((hit) => (
                  <Box key={hit.result.id} p={2} borderWidth="1px" borderRadius="lg" cursor="pointer"
                       _hover={{ shadow: 'md', borderColor: 'purple.500' }}
                       onClick={() => handleSelectItem(hit)}>
                    <HStack>
                      <Image src={hit.result.song_art_image_thumbnail_url || ''} 
                             alt={hit.result.title} boxSize="75px" objectFit="cover" borderRadius="md" />
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold" noOfLines={2}>{hit.result.title}</Text>
                        <Text fontSize="sm" noOfLines={1}>{hit.result.artist_names}</Text>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </Box>
      )}

      {/* --- ADD FAVORITE FORM --- */}
      {selectedItem && (
        <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg" position="relative">
          <CloseButton position="absolute" top={4} right={4} onClick={() => setSelectedItem(null)} />
          <form onSubmit={handleAddFavorite}>
            <VStack spacing={4}>
              <Heading size="md">Add to Shared Favorites</Heading>
              
              {searchCategory === 'Movie' && (
                <HStack>
                  <Image src={`https://image.tmdb.org/t/p/w200${selectedItem.poster_path}`} 
                         alt={selectedItem.title} boxSize="100px" objectFit="cover" borderRadius="md" />
                  <VStack align="start">
                    <Heading size="sm">{selectedItem.title}</Heading>
                    <Text fontSize="sm">({selectedItem.release_date?.split('-')[0]})</Text>
                  </VStack>
                </HStack>
              )}
              
              {searchCategory === 'Book' && (
                <HStack>
                  <Image src={selectedItem.volumeInfo.imageLinks?.thumbnail || ''} 
                         alt={selectedItem.volumeInfo.title} boxSize="100px" objectFit="cover" borderRadius="md" />
                  <VStack align="start">
                    <Heading size="sm" noOfLines={2}>{selectedItem.volumeInfo.title}</Heading>
                    <Text fontSize="sm">({selectedItem.volumeInfo.publishedDate?.split('-')[0]})</Text>
                  </VStack>
                </HStack>
              )}

              {searchCategory === 'Song' && (
                <HStack>
                  <Image src={selectedItem.result.song_art_image_thumbnail_url || ''} 
                         alt={selectedItem.result.title} boxSize="100px" objectFit="cover" borderRadius="md" />
                  <VStack align="start">
                    <Heading size="sm" noOfLines={2}>{selectedItem.result.title}</Heading>
                    <Text fontSize="sm" noOfLines={1}>{selectedItem.result.artist_names}</Text>
                  </VStack>
                </HStack>
              )}
              
              <FormControl>
                <FormLabel>Your Comments (Optional)</FormLabel>
                <Textarea
                  placeholder="Why does the group love this?"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </FormControl>
              
              <Button type="submit" colorScheme="purple" width="full" isLoading={isSaving}>
                Save Shared Favorite
              </Button>
            </VStack>
          </form>
        </Box>
      )}

      {/* --- EXISTING FAVORITES --- */}
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={4}>Our Shared Favorites</Heading>
        {loading ? (
          <Spinner size="xl" />
        ) : favorites.length === 0 ? (
          <Text>No favorites saved in this capsule yet.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {favorites.map((item) => {
              const email = userMap[item.user_id] || 'An invited user';
              return (
                <Box 
                  key={item.id} 
                  p={4} 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  h="100%"
                >
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      borderRadius="md"
                      mb={2}
                      w="100%"
                      h={{ base: "300px", md: "350px" }}
                      objectFit="contain"
                      bg="gray.100"
                      p={2}
                    />
                  ) : (
                    <Box
                      h={{ base: "300px", md: "350px" }}
                      w="100%"
                      bg="gray.100"
                      borderRadius="md"
                      mb={2}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="gray.400">No Image</Text>
                    </Box>
                  )}
                  
                  <Flex justify="space-between" align="start" mt={2}>
                    <Text fontWeight="bold" noOfLines={2} mr={2}>
                      {item.title}
                    </Text>
                    <IconButton
                      icon={<DeleteIcon />}
                      isRound
                      size="md"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleDeleteFavorite(item.id)}
                    />
                  </Flex>

                  <Text fontSize="sm" color="gray.500" noOfLines={3} mt={1}>
                    {item.notes}
                  </Text>
                  
                  <HStack mt={2} pt={2} borderTopWidth="1px" borderColor="gray.200">
                    <Avatar name={email} size="xs" />
                    <Text fontSize="xs" color="gray.500">
                      Added by {email}
                    </Text>
                  </HStack>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Box>
    </VStack>
  );
};

export default SharedFavorites;