// WebRTC Connection Management
export class WebRTCConnection {
  constructor() {
    this.peerConnection = null;
    this.dataChannel = null;
    this.isConnected = false;
    this.listeners = {
      connected: [],
      disconnected: [],
      data: [],
      error: []
    };
    
    // STUN servers for NAT traversal
    this.stunServers = [
      'stun:stun.l.google.com:19302',
      'stun:stun1.l.google.com:19302',
      'stun:stun2.l.google.com:19302',
      'stun:stun3.l.google.com:19302',
      'stun:stun4.l.google.com:19302'
    ];
  }
  
  // Event listener management
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }
  
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
  
  // Create peer connection
  createPeerConnection(turnServer = null) {
    const config = {
      iceServers: [
        ...this.stunServers.map(url => ({ urls: url }))
      ]
    };
    
    // Add TURN server if provided
    if (turnServer) {
      config.iceServers.push({ urls: turnServer });
    }
    
    this.peerConnection = new RTCPeerConnection(config);
    
    // Set up event handlers
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
      
      if (this.peerConnection.iceConnectionState === 'connected' || 
          this.peerConnection.iceConnectionState === 'completed') {
        this.isConnected = true;
        this.emit('connected');
      } else if (this.peerConnection.iceConnectionState === 'disconnected' ||
                 this.peerConnection.iceConnectionState === 'failed' ||
                 this.peerConnection.iceConnectionState === 'closed') {
        this.isConnected = false;
        this.emit('disconnected');
      }
    };
    
    this.peerConnection.ondatachannel = (event) => {
      this.setupDataChannel(event.channel);
    };
    
    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
    };
    
    return this.peerConnection;
  }
  
  // Setup data channel
  setupDataChannel(channel) {
    this.dataChannel = channel;
    
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.emit('connected');
    };
    
    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.emit('disconnected');
    };
    
    this.dataChannel.onmessage = (event) => {
      this.emit('data', event.data);
    };
    
    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      this.emit('error', error);
    };
  }
  
  // Create offer (sender)
  async createOffer(turnServer = null) {
    this.createPeerConnection(turnServer);
    
    // Create data channel
    this.dataChannel = this.peerConnection.createDataChannel('fileTransfer', {
      ordered: true,
      maxRetransmits: 3
    });
    
    this.setupDataChannel(this.dataChannel);
    
    // Create offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    // Wait for ICE gathering to complete
    return new Promise((resolve) => {
      if (this.peerConnection.iceGatheringState === 'complete') {
        resolve(this.peerConnection.localDescription);
      } else {
        this.peerConnection.onicegatheringstatechange = () => {
          if (this.peerConnection.iceGatheringState === 'complete') {
            resolve(this.peerConnection.localDescription);
          }
        };
      }
    });
  }
  
  // Create answer (receiver)
  async createAnswer(offerSdp, turnServer = null) {
    this.createPeerConnection(turnServer);
    
    // Set remote description
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerSdp));
    
    // Create answer
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    
    // Wait for ICE gathering to complete
    return new Promise((resolve) => {
      if (this.peerConnection.iceGatheringState === 'complete') {
        resolve(this.peerConnection.localDescription);
      } else {
        this.peerConnection.onicegatheringstatechange = () => {
          if (this.peerConnection.iceGatheringState === 'complete') {
            resolve(this.peerConnection.localDescription);
          }
        };
      }
    });
  }
  
  // Apply remote answer (sender)
  async applyAnswer(answerSdp) {
    if (this.peerConnection) {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerSdp));
    }
  }
  
  // Send data
  send(data) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(data);
      return true;
    }
    return false;
  }
  
  // Get connection stats
  async getStats() {
    if (this.peerConnection) {
      return await this.peerConnection.getStats();
    }
    return null;
  }
  
  // Check buffered amount
  getBufferedAmount() {
    return this.dataChannel ? this.dataChannel.bufferedAmount : 0;
  }
  
  // Check if connected
  isConnectedState() {
    return this.isConnected;
  }
  
  // Disconnect
  disconnect() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.isConnected = false;
    this.emit('disconnected');
  }
  
  // Connect (alias for compatibility)
  async connect() {
    // Connection happens automatically when both sides are ready
    return Promise.resolve();
  }
}