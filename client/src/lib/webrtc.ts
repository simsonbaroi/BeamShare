import { generatePairingCode as genCode, parsePairingCode } from "./qr-utils";
import { encryptData, decryptData } from "./crypto";

interface PeerConnectionOptions {
  isOfferer: boolean;
  pairingCode?: string;
  encryptionKey?: string;
  turnServer?: string;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onDataReceived?: (data: any) => void;
}

interface PeerConnectionResult {
  peerConnection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  offerCode?: string;
}

const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun2.l.google.com:19302',
  'stun:stun3.l.google.com:19302',
  'stun:stun4.l.google.com:19302'
];

export async function createPeerConnection(options: PeerConnectionOptions): Promise<PeerConnectionResult> {
  const {
    isOfferer,
    pairingCode,
    encryptionKey,
    turnServer,
    onConnectionStateChange,
    onConnected,
    onDisconnected,
    onDataReceived
  } = options;

  const iceServers: RTCIceServer[] = [
    ...STUN_SERVERS.map(url => ({ urls: url }))
  ];

  if (turnServer) {
    iceServers.push({ urls: turnServer });
  }

  const peerConnection = new RTCPeerConnection({
    iceServers,
    iceCandidatePoolSize: 10
  });

  let dataChannel: RTCDataChannel;

  // Handle connection state changes
  peerConnection.addEventListener('connectionstatechange', () => {
    const state = peerConnection.connectionState;
    onConnectionStateChange?.(state);
    
    if (state === 'connected') {
      onConnected?.();
    } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
      onDisconnected?.();
    }
  });

  if (isOfferer) {
    // Create data channel
    dataChannel = peerConnection.createDataChannel('fileTransfer', {
      ordered: true,
      maxRetransmits: 3
    });

    setupDataChannel(dataChannel, encryptionKey, onDataReceived);

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Wait for ICE gathering to complete
    await new Promise<void>((resolve) => {
      if (peerConnection.iceGatheringState === 'complete') {
        resolve();
      } else {
        const onIceGatheringComplete = () => {
          if (peerConnection.iceGatheringState === 'complete') {
            peerConnection.removeEventListener('icegatheringstatechange', onIceGatheringComplete);
            resolve();
          }
        };
        peerConnection.addEventListener('icegatheringstatechange', onIceGatheringComplete);
      }
    });

    const offerCode = await genCode({
      type: 'offer',
      sdp: peerConnection.localDescription!.sdp,
      encryptionKey
    });

    return { peerConnection, dataChannel, offerCode };

  } else {
    // Handle incoming data channel
    peerConnection.addEventListener('datachannel', (event) => {
      dataChannel = event.channel;
      setupDataChannel(dataChannel, encryptionKey, onDataReceived);
    });

    if (!pairingCode) {
      throw new Error('Pairing code is required for answerer');
    }

    const offerData = await parsePairingCode(pairingCode);
    
    if (offerData.type !== 'offer') {
      throw new Error('Invalid pairing code - not an offer');
    }

    const offer: RTCSessionDescriptionInit = {
      type: 'offer',
      sdp: offerData.sdp
    };

    await peerConnection.setRemoteDescription(offer);

    // Create answer
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // In a real implementation, you would need a signaling server to exchange the answer
    // For this demo, we'll simulate a direct connection
    // The answer would need to be sent back to the offerer through the same pairing mechanism

    return { peerConnection, dataChannel: dataChannel! };
  }
}

function setupDataChannel(
  dataChannel: RTCDataChannel,
  encryptionKey?: string,
  onDataReceived?: (data: any) => void
) {
  dataChannel.addEventListener('open', () => {
    console.log('Data channel opened');
  });

  dataChannel.addEventListener('close', () => {
    console.log('Data channel closed');
  });

  dataChannel.addEventListener('error', (error) => {
    console.error('Data channel error:', error);
  });

  dataChannel.addEventListener('message', async (event) => {
    try {
      let data = event.data;
      
      if (encryptionKey) {
        data = await decryptData(data, encryptionKey);
      }

      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch {
        parsedData = data;
      }

      onDataReceived?.(parsedData);
    } catch (error) {
      console.error('Error processing received data:', error);
    }
  });
}

export { generatePairingCode } from "./qr-utils";
