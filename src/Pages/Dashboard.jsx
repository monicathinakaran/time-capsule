// src/Pages/Dashboard.jsx
import React from 'react';
import { 
  Box, 
  Container, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel 
} from '@chakra-ui/react';
import Navbar from './components/nav_bar.jsx';
import Journal from './Journal.jsx';
import BucketList from './BucketList.jsx'; 
import FutureLetters from './FutureLetters.jsx';
import Favorites from './Favorites.jsx'; // 1. Import the new component

const Dashboard = ({ session }) => {
  return (
    <Box>
      <Navbar />
      <Box 
        bgGradient="linear(to-br, teal.100, purple.200)"
        minH="100vh"
        pt={16}
      >
        <Container maxW="container.lg" py={12}>
          <Tabs isFitted variant="enclosed" colorScheme="purple">
            <TabList mb="1em" bg="whiteAlpha.700" borderRadius="lg">
              <Tab _selected={{ color: 'white', bg: 'purple.600' }}>Journal</Tab>
              <Tab _selected={{ color: 'white', bg: 'purple.600' }}>Bucket List</Tab>
              <Tab _selected={{ color: 'white', bg: 'purple.600' }}>Future Letters</Tab>
              {/* 2. Add the new Tab */}
              <Tab _selected={{ color: 'white', bg: 'purple.600' }}>Favorites</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel p={0}>
                <Journal session={session} />
              </TabPanel>
              
              <TabPanel p={0}>
                <BucketList session={session} />
              </TabPanel>
              
              <TabPanel p={0}>
                <FutureLetters session={session} />
              </TabPanel>

              {/* 3. Add the new TabPanel */}
              <TabPanel p={0}>
                <Favorites session={session} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;