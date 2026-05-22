import { useState, useEffect } from 'react';
import {
  Box, Container, Grid, GridItem, Heading, Text, SimpleGrid, 
  HStack, VStack, Icon, Flex, Spinner, Badge, Progress
} from '@chakra-ui/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, FiActivity, FiClock, FiAlertTriangle, 
  FiUsers, FiMap, FiCheckCircle, FiCpu
} from 'react-icons/fi';
import { analyticsService } from '../services/api';

const MotionBox = motion(Box);

const COLORS = ['#e53e3e', '#d69e2e', '#38a169', '#00bcd4', '#0080e6'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, hospitalRes] = await Promise.all([
          analyticsService.getOverview(),
          analyticsService.getHospitals()
        ]);
        setData(overviewRes.data);
        setHospitals(hospitalRes.data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <Flex minH="100vh" bg="#0a0e1a" align="center" justify="center">
      <VStack spacing={4}><Spinner color="brand.400" size="xl" /><Text color="whiteAlpha.400">Aggregating real-time insights...</Text></VStack>
    </Flex>
  );

  return (
    <Box minH="100vh" bg="#0a0e1a" pt="80px" pb="40px">
      <Box position="fixed" top="-20%" left="-10%" w="800px" h="800px" borderRadius="full" bg="radial-gradient(circle, rgba(0,188,212,0.05) 0%, transparent 70%)" filter="blur(80px)" pointerEvents="none" />
      
      <Container maxW="1600px">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <HStack mb={1}>
              <Icon as={FiTrendingUp} color="brand.400" />
              <Text fontSize="sm" color="whiteAlpha.500" fontWeight="700" textTransform="uppercase" letterSpacing="2px">Mission Control Analytics</Text>
            </HStack>
            <Heading fontSize="3xl" fontWeight="900" bgGradient="linear(to-r, white, whiteAlpha.700)" bgClip="text">Operational Intelligence</Heading>
          </Box>
          <HStack spacing={4}>
            <Badge colorScheme="green" variant="subtle" px={4} py={2} borderRadius="12px" fontSize="xs">
              <HStack><Box w={2} h={2} borderRadius="full" bg="green.400" className="pulse-animation" /><Text>LIVE STREAM ACTIVE</Text></HStack>
            </Badge>
          </HStack>
        </Flex>

        {/* Top KPIs */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          {[
            { label: 'Today\'s Emergencies', value: data?.overview?.totalToday, icon: FiAlertTriangle, color: '#e53e3e', trend: '+12% from yesterday' },
            { label: 'Avg Response Time', value: `${data?.overview?.avgResponseTime}m`, icon: FiClock, color: '#00bcd4', trend: '-2m optimization' },
            { label: 'Active Responders', value: data?.overview?.activeCount, icon: FiUsers, color: '#0080e6', trend: '94% utilization' },
            { label: 'Resolved (All Time)', value: data?.overview?.resolvedCount, icon: FiCheckCircle, color: '#38a169', trend: '98% success rate' },
          ].map((stat, i) => (
            <MotionBox key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" p={6} position="relative" overflow="hidden" backdropFilter="blur(10px)">
                <Box position="absolute" top="0" right="0" p={4} opacity="0.1"><Icon as={stat.icon} boxSize={20} color={stat.color} /></Box>
                <VStack align="flex-start" spacing={1}>
                  <HStack spacing={3} mb={2}>
                    <Box w="36px" h="36px" borderRadius="10px" bg={`${stat.color}15`} display="flex" alignItems="center" justifyContent="center"><Icon as={stat.icon} color={stat.color} /></Box>
                    <Text fontSize="xs" fontWeight="600" color="whiteAlpha.400">{stat.label}</Text>
                  </HStack>
                  <Text fontSize="3xl" fontWeight="900" color="white">{stat.value}</Text>
                  <Text fontSize="10px" color="green.400" fontWeight="700">{stat.trend}</Text>
                </VStack>
              </Box>
            </MotionBox>
          ))}
        </SimpleGrid>

        <Grid templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }} gap={6}>
          {/* Hourly Trends */}
          <GridItem colSpan={{ base: 1, lg: 2 }}>
            <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" p={8} backdropFilter="blur(10px)">
              <HStack justify="space-between" mb={8}>
                <Heading fontSize="lg">Emergency Frequency (24h)</Heading>
                <HStack><Box w={3} h={3} borderRadius="full" bg="brand.500" /><Text fontSize="xs" color="whiteAlpha.500">Live Traffic</Text></HStack>
              </HStack>
              <Box h="300px" w="100%">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.hourlyTrends}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0080e6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0080e6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="hour" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: '#0f1428', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#0080e6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </GridItem>

          {/* Severity Distribution */}
          <GridItem>
            <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" p={8} backdropFilter="blur(10px)">
              <Heading fontSize="lg" mb={8}>Severity Distribution</Heading>
              <Box h="300px" w="100%">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.severityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data?.severityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#0f1428', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <VStack align="stretch" spacing={3} mt={4}>
                {data?.severityDistribution.map((s, i) => (
                  <HStack key={i} justify="space-between">
                    <HStack><Box w={2} h={2} borderRadius="full" bg={COLORS[i]} /><Text fontSize="xs" fontWeight="600">{s.name}</Text></HStack>
                    <Text fontSize="xs" fontWeight="800">{s.value}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </GridItem>

          {/* Hospital Load Analysis */}
          <GridItem colSpan={{ base: 1, lg: 3 }}>
            <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" p={8} backdropFilter="blur(10px)">
              <HStack justify="space-between" mb={8}>
                <Box>
                  <Heading fontSize="lg">Hospital Network Load</Heading>
                  <Text fontSize="xs" color="whiteAlpha.400">Real-time occupancy across critical care facilities</Text>
                </Box>
                <Icon as={FiMap} color="whiteAlpha.300" boxSize={6} />
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {hospitals.map((h, i) => (
                  <Box key={i} p={5} borderRadius="20px" bg="rgba(255,255,255,0.03)" border="1px solid rgba(255,255,255,0.04)">
                    <HStack justify="space-between" mb={4}>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="800" fontSize="sm">{h.name}</Text>
                        <Text fontSize="10px" color="whiteAlpha.400">EMERGENCY WARD</Text>
                      </VStack>
                      <Badge colorScheme={h.loadPercentage > 80 ? 'red' : h.loadPercentage > 50 ? 'orange' : 'green'} fontSize="10px">
                        {h.loadPercentage}% LOAD
                      </Badge>
                    </HStack>
                    <Progress value={h.loadPercentage} size="xs" colorScheme={h.loadPercentage > 80 ? 'red' : 'blue'} borderRadius="full" bg="whiteAlpha.100" mb={4} />
                    <HStack justify="space-between" fontSize="xs">
                      <HStack><Text color="whiteAlpha.400">Active Cases:</Text><Text fontWeight="700">{h.activeCases}</Text></HStack>
                      <HStack><Text color="whiteAlpha.400">Capacity:</Text><Text fontWeight="700">{h.capacity}</Text></HStack>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </GridItem>

          {/* Category Metrics */}
          <GridItem colSpan={{ base: 1, lg: 3 }}>
            <Box bg="rgba(15,20,40,0.6)" border="1px solid rgba(255,255,255,0.06)" borderRadius="24px" p={8} backdropFilter="blur(10px)">
              <Heading fontSize="lg" mb={8}>Emergency Categories</Heading>
              <Box h="300px" w="100%">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.categoryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ background: '#0f1428', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="value" fill="#00bcd4" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default AnalyticsDashboard;
