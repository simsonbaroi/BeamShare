import { useState, useCallback, useRef } from "react";
import { createPeerConnection, generatePairingCode } from "@/lib/webrtc";

interface UseWebRTCOptions {
  encryptionKey?: string;
  turnServer?: string;
}

export function useWebRTC({ encryptionKey, turnServer }: UseWebRTCOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [localPeerCode, setLocalPeerCode] = useState('');
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  const createOffer = useCallback(async () => {
    try {
      const { peerConnection, dataChannel, offerCode } = await createPeerConnection({
        isOfferer: true,
        encryptionKey,
        turnServer,
        onConnectionStateChange: setConnectionState,
        onConnected: () => setIsConnected(true),
        onDisconnected: () => setIsConnected(false)
      });

      peerConnectionRef.current = peerConnection;
      dataChannelRef.current = dataChannel;
      setLocalPeerCode(offerCode || '');
      
      return offerCode;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }, [encryptionKey, turnServer]);

  const connect = useCallback(async (pairingCode: string) => {
    try {
      const { peerConnection, dataChannel } = await createPeerConnection({
        isOfferer: false,
        pairingCode,
        encryptionKey,
        turnServer,
        onConnectionStateChange: setConnectionState,
        onConnected: () => setIsConnected(true),
        onDisconnected: () => setIsConnected(false)
      });

      peerConnectionRef.current = peerConnection;
      dataChannelRef.current = dataChannel;
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }, [encryptionKey, turnServer]);

  const sendData = useCallback((data: ArrayBuffer | string) => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      if (typeof data === 'string') {
        dataChannelRef.current.send(data);
      } else {
        dataChannelRef.current.send(data);
      }
      return true;
    }
    return false;
  }, []);

  const acceptOffer = useCallback(async (offerCode: string) => {
    return connect(offerCode);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    setIsConnected(false);
    setConnectionState('closed');
  }, []);

  return {
    isConnected,
    connectionState,
    localPeerCode,
    createOffer,
    connect,
    acceptOffer,
    sendData,
    disconnect
  };
}
