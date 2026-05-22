import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Box, IconButton, Badge, Menu, MenuButton, MenuList, MenuItem,
  Text, VStack, HStack, Icon, useToast, Spinner, Flex, Divider
} from '@chakra-ui/react';
import { FiBell, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { notificationService } from '../services/api';
import { getSocket, joinUserRoom } from '../services/socket';

const NotificationBell = () => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      const socket = getSocket();
      joinUserRoom(userId);

      const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Play sound for high priority
        if (['high', 'critical'].includes(notification.priority)) {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(e => console.log('Audio play blocked'));
        }

        toast({
          title: notification.title,
          description: notification.message,
          status: notification.priority === 'critical' ? 'error' : 'info',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });
      };

      socket.on('new_notification', handleNewNotification);
      return () => socket.off('new_notification', handleNewNotification);
    }
  }, [userId]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'emergency_created': return <FiAlertCircle color="#e53e3e" />;
      case 'emergency_resolved': return <FiCheckCircle color="#38a169" />;
      default: return <FiInfo color="#0080e6" />;
    }
  };

  return (
    <Menu closeOnSelect={false}>
      <MenuButton
        as={IconButton}
        icon={
          <Box position="relative">
            <FiBell size={20} />
            {unreadCount > 0 && (
              <Badge
                position="absolute"
                top="-8px"
                right="-8px"
                bg="red.500"
                color="white"
                borderRadius="full"
                fontSize="10px"
                minW="18px"
                textAlign="center"
                boxShadow="0 0 10px rgba(229, 62, 62, 0.5)"
              >
                {unreadCount}
              </Badge>
            )}
          </Box>
        }
        variant="ghost"
        color="whiteAlpha.700"
        _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.08)' }}
        borderRadius="12px"
      />
      <MenuList
        bg="#0f1428"
        border="1px solid rgba(255, 255, 255, 0.1)"
        boxShadow="0 10px 30px rgba(0,0,0,0.5)"
        p={0}
        maxH="400px"
        overflowY="auto"
        w="320px"
        borderRadius="16px"
      >
        <Box p={4} borderBottom="1px solid rgba(255, 255, 255, 0.06)">
          <Text fontWeight="800" fontSize="sm">{t('notificationsTitle')}</Text>
        </Box>
        
        {loading ? (
          <Flex p={8} justify="center"><Spinner size="sm" /></Flex>
        ) : notifications.length === 0 ? (
          <Box p={8} textAlign="center">
            <Text fontSize="xs" color="whiteAlpha.400">{t('noNotifications')}</Text>
          </Box>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n._id}
              bg={n.isRead ? 'transparent' : 'rgba(0, 128, 230, 0.05)'}
              p={4}
              onClick={() => markAsRead(n._id)}
              _hover={{ bg: 'rgba(255, 255, 255, 0.04)' }}
            >
              <HStack align="flex-start" spacing={3}>
                <Box mt={1}>{getIcon(n.type)}</Box>
                <VStack align="flex-start" spacing={0}>
                  <Text fontSize="xs" fontWeight="700" color="white">{n.title}</Text>
                  <Text fontSize="10px" color="whiteAlpha.500" noOfLines={2}>{n.message}</Text>
                  <Text fontSize="9px" color="whiteAlpha.300" mt={1}>
                    {new Date(n.createdAt).toLocaleTimeString()}
                  </Text>
                </VStack>
                {!n.isRead && <Box w={2} h={2} borderRadius="full" bg="brand.400" mt={2} />}
              </HStack>
            </MenuItem>
          ))
        )}
      </MenuList>
    </Menu>
  );
};

export default NotificationBell;
