// BeamShare - Main Application Entry Point
import { AppState } from './ui/state.js';
import { ThemeManager } from './ui/theme.js';
import { WebRTCConnection } from './webrtc/connection.js';
import { SignalingManager } from './webrtc/signaling.js';
import { FileTransferManager } from './webrtc/transfer.js';
import { StorageManager } from './storage/manager.js';
import { UIManager } from './ui/manager.js';

class BeamShareApp {
  constructor() {
    this.state = new AppState();
    this.theme = new ThemeManager();
    this.webrtc = new WebRTCConnection();
    this.signaling = new SignalingManager();
    this.transfer = new FileTransferManager();
    this.storage = new StorageManager();
    this.ui = new UIManager();
    
    this.init();
  }
  
  async init() {
    try {
      // Initialize theme
      this.theme.init();
      
      // Initialize UI
      this.ui.init(this.state);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Hide loading screen and show role selection
      setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('role-selection').classList.remove('hidden');
      }, 1000);
      
    } catch (error) {
      console.error('Failed to initialize BeamShare:', error);
      this.showError('Failed to initialize application. Please refresh the page.');
    }
  }
  
  setupEventListeners() {
    // Role selection
    document.getElementById('sender-card').addEventListener('click', () => this.selectRole('sender'));
    document.getElementById('receiver-card').addEventListener('click', () => this.selectRole('receiver'));
    
    // Keyboard support
    document.getElementById('sender-card').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.selectRole('sender');
      }
    });
    
    document.getElementById('receiver-card').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.selectRole('receiver');
      }
    });
    
    // Settings
    document.getElementById('encryption-toggle').addEventListener('change', (e) => {
      this.state.updateSettings({ encryption: e.target.checked });
    });
    
    document.getElementById('turn-server').addEventListener('input', (e) => {
      this.state.updateSettings({ turnServer: e.target.value });
    });
  }
  
  async selectRole(role) {
    try {
      this.state.setRole(role);
      
      // Hide role selection
      document.getElementById('role-selection').classList.add('hidden');
      
      if (role === 'sender') {
        await this.initSender();
      } else {
        await this.initReceiver();
      }
      
    } catch (error) {
      console.error(`Failed to initialize ${role}:`, error);
      this.showError(`Failed to initialize ${role} mode. Please try again.`);
    }
  }
  
  async initSender() {
    // Show sender screen
    document.getElementById('sender-screen').classList.remove('hidden');
    
    // Initialize sender UI
    await this.ui.initSenderScreen({
      onFilesSelected: (files) => this.handleFilesSelected(files),
      onStartTransfer: () => this.startSenderFlow(),
      onBack: () => this.goBack()
    });
  }
  
  async initReceiver() {
    // Show receiver screen
    document.getElementById('receiver-screen').classList.remove('hidden');
    
    // Initialize receiver UI
    await this.ui.initReceiverScreen({
      onPairingCode: (code) => this.handlePairingCode(code),
      onReady: () => this.setReady(),
      onBack: () => this.goBack()
    });
  }
  
  async handleFilesSelected(files) {
    this.state.setFiles(files);
  }
  
  async startSenderFlow() {
    try {
      // Create WebRTC offer
      const offer = await this.webrtc.createOffer();
      
      // Generate pairing code
      const pairingCode = await this.signaling.createPairingCode({
        role: 'sender',
        sdp: offer,
        encryption: this.state.settings.encryption,
        files: this.state.files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });
      
      // Show QR code and wait for receiver
      await this.ui.showPairingCode(pairingCode);
      
    } catch (error) {
      console.error('Failed to start sender flow:', error);
      this.showError('Failed to create pairing code. Please try again.');
    }
  }
  
  async handlePairingCode(code) {
    try {
      // Parse pairing code
      const pairingData = await this.signaling.parsePairingCode(code);
      
      if (pairingData.role === 'sender') {
        // Create answer
        const answer = await this.webrtc.createAnswer(pairingData.sdp);
        
        // Generate response code
        const responseCode = await this.signaling.createPairingCode({
          role: 'receiver',
          sdp: answer,
          encryption: pairingData.encryption
        });
        
        // Show response QR code
        await this.ui.showPairingResponse(responseCode, pairingData);
      }
      
    } catch (error) {
      console.error('Failed to handle pairing code:', error);
      this.showError('Invalid pairing code. Please try again.');
    }
  }
  
  async setReady() {
    this.state.setReady(true);
    
    // Start connection
    await this.webrtc.connect();
    
    // Show transfer screen
    this.showTransferScreen();
  }
  
  showTransferScreen() {
    // Hide current screen
    document.querySelectorAll('#app > div').forEach(screen => {
      if (!screen.id === 'app') screen.classList.add('hidden');
    });
    
    // Show transfer screen
    document.getElementById('transfer-screen').classList.remove('hidden');
    
    // Initialize transfer UI
    this.ui.initTransferScreen({
      onComplete: () => this.showComplete(),
      onCancel: () => this.cancelTransfer()
    });
  }
  
  showComplete() {
    // Hide transfer screen
    document.getElementById('transfer-screen').classList.add('hidden');
    
    // Show complete screen
    document.getElementById('complete-screen').classList.remove('hidden');
    
    // Initialize complete UI
    this.ui.initCompleteScreen({
      onNewTransfer: () => this.goBack()
    });
  }
  
  goBack() {
    // Reset state
    this.state.reset();
    
    // Hide all screens
    document.querySelectorAll('#app > div').forEach(screen => {
      screen.classList.add('hidden');
    });
    
    // Show role selection
    document.getElementById('role-selection').classList.remove('hidden');
  }
  
  cancelTransfer() {
    if (confirm('Are you sure you want to cancel the transfer?')) {
      this.webrtc.disconnect();
      this.goBack();
    }
  }
  
  showError(message) {
    // Simple error display - could be enhanced with a modal
    alert(message);
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.beamShare = new BeamShareApp();
  });
} else {
  window.beamShare = new BeamShareApp();
}