import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useWebSocket(conversionId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!conversionId) return;

    const socketInstance = io('http://localhost:3001');

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [conversionId]);

  const onProgress = (callback: (data: any) => void) => {
    if (!socket) return;

    socket.on(`progress:${conversionId}`, callback);

    return () => {
      socket.off(`progress:${conversionId}`, callback);
    };
  };

  return { socket, isConnected, onProgress };
}
