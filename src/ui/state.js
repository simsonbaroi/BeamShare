// Application State Management
export class AppState {
  constructor() {
    this.state = {
      role: null, // 'sender' | 'receiver'
      files: [],
      isReady: false,
      isConnected: false,
      transferProgress: {},
      settings: {
        encryption: false,
        turnServer: '',
        theme: 'auto'
      }
    };
    
    this.listeners = [];
    this.loadSettings();
  }
  
  // Subscribe to state changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  // Notify listeners of state changes
  notify(changes) {
    this.listeners.forEach(callback => callback(this.state, changes));
  }
  
  // Update state and notify listeners
  updateState(changes) {
    const oldState = { ...this.state };
    Object.assign(this.state, changes);
    this.notify(changes);
  }
  
  // Role management
  setRole(role) {
    this.updateState({ role });
  }
  
  getRole() {
    return this.state.role;
  }
  
  // File management
  setFiles(files) {
    this.updateState({ files: Array.from(files) });
  }
  
  getFiles() {
    return this.state.files;
  }
  
  // Ready state
  setReady(ready) {
    this.updateState({ isReady: ready });
  }
  
  isReady() {
    return this.state.isReady;
  }
  
  // Connection state
  setConnected(connected) {
    this.updateState({ isConnected: connected });
  }
  
  isConnected() {
    return this.state.isConnected;
  }
  
  // Transfer progress
  updateTransferProgress(fileId, progress) {
    const transferProgress = { ...this.state.transferProgress };
    transferProgress[fileId] = progress;
    this.updateState({ transferProgress });
  }
  
  getTransferProgress(fileId) {
    return this.state.transferProgress[fileId] || { progress: 0, speed: 0, eta: 0 };
  }
  
  // Settings management
  updateSettings(newSettings) {
    const settings = { ...this.state.settings, ...newSettings };
    this.updateState({ settings });
    this.saveSettings();
  }
  
  getSettings() {
    return this.state.settings;
  }
  
  // Persistence
  saveSettings() {
    try {
      localStorage.setItem('beamshare-settings', JSON.stringify(this.state.settings));
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
  }
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('beamshare-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.state.settings = { ...this.state.settings, ...settings };
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
    }
  }
  
  // Reset state
  reset() {
    this.updateState({
      role: null,
      files: [],
      isReady: false,
      isConnected: false,
      transferProgress: {}
    });
  }
  
  // Get complete state (for debugging)
  getState() {
    return { ...this.state };
  }
}