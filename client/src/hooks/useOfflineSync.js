import { useState, useEffect } from 'react';
import { offlineService } from '../services/offlineService';
import { emergencyService } from '../services/api';
import { useToast } from '@chakra-ui/react';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncQueuedItems();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncQueuedItems = async () => {
    const queued = await offlineService.getQueuedEmergencies();
    if (queued.length === 0) return;

    setSyncing(true);
    toast({
      title: 'Back online',
      description: `Syncing ${queued.length} queued emergency requests...`,
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });

    for (const item of queued) {
      try {
        await emergencyService.create(item);
        await offlineService.clearSynced(item.id);
      } catch (err) {
        console.error('Failed to sync item:', item, err);
      }
    }

    setSyncing(false);
    toast({
      title: 'Sync complete',
      description: 'All queued emergencies have been submitted.',
      status: 'success',
      duration: 3000,
      isClosable: true,
      position: 'top',
    });
  };

  return { isOnline, syncing };
};
