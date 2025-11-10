// src/Pages/Favorites.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase_client.js';
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
} from '@chakra-ui/react';

// ... (All API keys and component setup is the same) ...
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const GOOGLE_BOOKS_API_KEY = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
const GENIUS_ACCESS_TOKEN = import.meta.env.VITE_GENIUS_ACCESS_TOKEN;

const Favorites = ({ session }) => {
  const [favorites, setFavorites] = useState([]);
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

  // ... (All functions: useEffect, handleSearch, handleSelectItem, handleAddFavorite, changeCategory are the same) ...
  // 1. Fetch existing favorites
  useEffect(() => {
    const getFavorites = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.error('Error fetching favorites:', error);
      else setFavorites(data);
      setLoading(false);
    };
    getFavorites();
  }, [user.id]);

  // 2. Search function
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedItem(null);

    try {
      let response;
      if (searchCategory === 'Movie') {
        response = await axios.get(
          `https://api.themoviedb.org/3/search/movie`, {
            params: { api_key: TMDB_API_KEY, query: searchQuery }
          }
        );
        setSearchResults(response.data.results);
      } else if (searchCategory === 'Book') {
        response = await axios.get(
          `https://www.googleapis.com/books/v1/volumes`, {
            params: { q: searchQuery, key: GOOGLE_BOOKS_API_KEY }
          }
        );
        setSearchResults(response.data.items || []);
      } else if (searchCategory === 'Song') {
        const { data, error } = await supabase.functions.invoke(
          'search-genius',
          { body: { query: searchQuery } }
        )
        if (error) throw error;
        setSearchResults(data.response.hits || []);
      }
    } catch (error) {
      console.error(`Error searching ${searchCategory}s:`, error);
      toast({ title: `Error searching ${searchCategory}s.`, status: 'error' });
    }
    setIsSearching(false);
  };

  // 3. Select item
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery('');
    setSearchResults([]);
    setComments('');
  };

  // 4. Save favorite
  const handleAddFavorite = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsSaving(true);

    let newFavorite;

    if (searchCategory === 'Movie') {
      newFavorite = {
        category: 'Movie',
        title: selectedItem.title,
        notes: comments,
        image_url: `https.image.tmdb.org/t/p/w500${selectedItem.poster_path}`,
        user_id: user.id,
      };
    } else if (searchCategory === 'Book') {
      newFavorite = {
        category: 'Book',
        title: selectedItem.volumeInfo.title,
        notes: comments,
        image_url: selectedItem.volumeInfo.imageLinks?.thumbnail || null,
        user_id: user.id,
      };
    } else if (searchCategory === 'Song') {
      const song = selectedItem.result;
      newFavorite = {
        category: 'Song',
        title: `${song.title} - ${song.artist_names}`,
        notes: comments,
        image_url: song.song_art_image_thumbnail_url || null,
        user_id: user.id,
      };
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert(newFavorite)
      .select()
      .single();

    if (error) {
      console.error('Error inserting favorite:', error);
      toast({ title: 'Error saving favorite.', status: 'error' });
    } else {
      setFavorites([data, ...favorites]);
      toast({ title: 'Favorite added!', status: 'success' });
      setSelectedItem(null);
      setComments('');
    }
    setIsSaving(false);
  };
  
  // 5. Helper function to reset the search
  const changeCategory = (e) => {
    setSearchCategory(e.target.value);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
  };

  return (
    <VStack spacing={8} align="stretch">
      {/* --- CHOOSE CATEGORY AND SEARCH (No change) --- */}
      {!selectedItem && (
        <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
          {/* ... (this whole section is unchanged) ... */}
          <form onSubmit={handleSearch}>
            <VStack spacing={4}>
              <Heading size="md">Search for a Favorite</Heading>
              
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
          
          {/* --- SEARCH RESULTS (No change) --- */}
          {searchResults.length > 0 && (
            <VStack align="stretch" mt={6}>
              {/* ... (this whole section is unchanged) ... */}
              <Heading size="sm">Search Results</Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {searchCategory === 'Movie' && searchResults.map((movie) => (
                  <Box key={movie.id} p={2} borderWidth="1px" borderRadius="lg" cursor="pointer"
                       _hover={{ shadow: 'md', borderColor: 'purple.500' }}
                       onClick={() => handleSelectItem(movie)}>
                    <HStack>
                      <Image src={`https.image.tmdb.org/t/p/w200${movie.poster_path}`} 
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

      {/* --- ADD FAVORITE FORM (No change) --- */}
      {selectedItem && (
        <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg" position="relative">
          {/* ... (this whole section is unchanged) ... */}
          <CloseButton position="absolute" top={4} right={4} onClick={() => setSelectedItem(null)} />
          <form onSubmit={handleAddFavorite}>
            <VStack spacing={4}>
              <Heading size="md">Add to Favorites</Heading>
              
              {searchCategory === 'Movie' && (
                <HStack>
                  <Image src={`https.image.tmdb.org/t/p/w200${selectedItem.poster_path}`} 
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
                  placeholder="Why did you love this?"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </FormControl>
              
              <Button type="submit" colorScheme="purple" width="full" isLoading={isSaving}>
                Save Favorite
              </Button>
            </VStack>
          </form>
        </Box>
      )}

      {/* --- === THIS IS THE UPDATED SECTION === --- */}
      <Box p={8} bg={formBg} borderRadius="xl" boxShadow="lg">
        <Heading size="lg" mb={4}>My Saved Favorites</Heading>
        {loading ? (
          <Spinner size="xl" />
        ) : favorites.length === 0 ? (
          <Text>You haven't added any favorites yet.</Text>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {favorites.map((item) => (
              <Box key={item.id} p={4} borderWidth="1px" borderRadius="lg" h="100%">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    borderRadius="md"
                    mb={2}
                    w="100%"
                    // 1. A consistent height for the image container
                    h={{ base: "300px", md: "350px" }}
                    // 2. THIS IS THE FIX:
                    objectFit="contain" // Fits the whole image, no cropping
                    bg="gray.100" // Adds a background to the container
                    p={2} // Adds some padding so the image doesn't touch the edges
                  />
                ) : (
                  // 3. A placeholder that matches the image height
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
                <Text fontWeight="bold" noOfLines={2}>{item.title}</Text>
                <Text fontSize="sm" color="gray.500" noOfLines={3}>
                  {item.notes}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>
      {/* --- === END OF UPDATED SECTION === --- */}
    </VStack>
  );
};

export default Favorites;