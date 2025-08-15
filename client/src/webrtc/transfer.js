// File Transfer Management
import { calculateSHA256 } from '../utils/checksum.js';
import { formatBytes, formatTime } from '../utils/bytes.js';

export class FileTransferManager {
  constructor() {
    // Dynamic chunk size based on connection quality
    this.chunkSize = this.getOptimalChunkSize();
    this.maxBufferedAmount = 32 * 1024 * 1024; // 32MB buffer for better throughput
    this.activeTransfers = new Map();
    this.listeners = {
      progress: [],
      complete: [],
      error: []
    };
    this.transferStartTime = null;
    this.lastSpeedCheck = null;
    this.speedHistory = [];
  }
  
  // Get optimal chunk size based on connection and device capabilities
  getOptimalChunkSize() {
    // Detect connection type and adjust chunk size accordingly
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const memoryGB = navigator.deviceMemory || 4; // Default to 4GB if unknown
    
    let baseChunkSize = 64 * 1024; // 64KB default
    
    if (connection) {
      switch (connection.effectiveType) {
        case '4g':
          baseChunkSize = 256 * 1024; // 256KB for 4G
          break;
        case '3g':
          baseChunkSize = 32 * 1024;  // 32KB for 3G
          break;
        case '2g':
        case 'slow-2g':
          baseChunkSize = 16 * 1024;  // 16KB for slow connections
          break;
        default:
          baseChunkSize = 128 * 1024; // 128KB for unknown/wifi
      }
    }
    
    // Adjust based on available memory
    if (memoryGB >= 8) {
      baseChunkSize *= 2; // Double chunk size for high-memory devices
    } else if (memoryGB <= 2) {
      baseChunkSize = Math.max(baseChunkSize / 2, 16 * 1024); // Halve for low-memory devices
    }
    
    return Math.min(baseChunkSize, 1024 * 1024); // Cap at 1MB
  }
  
  // Event handling
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
  
  // Send files through WebRTC data channel
  async sendFiles(files, dataChannel, options = {}) {
    const { encryption = false, encryptionKey } = options;
    
    try {
      // Send file manifest first
      const manifest = {
        type: 'manifest',
        files: files.map((file, index) => ({
          id: index,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        })),
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        encryption
      };
      
      dataChannel.send(JSON.stringify(manifest));
      
      // Send each file
      for (let i = 0; i < files.length; i++) {
        await this.sendFile(files[i], i, dataChannel, { encryption, encryptionKey });
      }
      
      // Send completion message
      dataChannel.send(JSON.stringify({ type: 'complete' }));
      
    } catch (error) {
      console.error('File transfer failed:', error);
      this.emit('error', { error: error.message });
      throw error;
    }
  }
  
  // Send individual file
  async sendFile(file, fileId, dataChannel, options = {}) {
    const transfer = {
      fileId,
      fileName: file.name,
      fileSize: file.size,
      sent: 0,
      startTime: Date.now(),
      hash: ''
    };
    
    this.activeTransfers.set(fileId, transfer);
    
    try {
      // Calculate file hash
      transfer.hash = await calculateSHA256(file);
      
      // Send file header
      const header = {
        type: 'file-start',
        fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        hash: transfer.hash
      };
      
      dataChannel.send(JSON.stringify(header));
      
      // Read and send file in chunks
      const reader = file.stream().getReader();
      let offset = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        // Wait if buffer is too full
        await this.waitForBuffer(dataChannel);
        
        // Send chunk
        const chunkHeader = {
          type: 'chunk',
          fileId,
          offset,
          size: value.length
        };
        
        dataChannel.send(JSON.stringify(chunkHeader));
        dataChannel.send(value);
        
        offset += value.length;
        transfer.sent = offset;
        
        // Update progress
        this.updateProgress(transfer);
      }
      
      // Send file end marker
      dataChannel.send(JSON.stringify({
        type: 'file-end',
        fileId,
        hash: transfer.hash
      }));
      
    } catch (error) {
      console.error(`Failed to send file ${file.name}:`, error);
      throw error;
    }
  }
  
  // Wait for data channel buffer to clear
  async waitForBuffer(dataChannel) {
    while (dataChannel.bufferedAmount > this.maxBufferedAmount) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Update transfer progress
  updateProgress(transfer) {
    const now = Date.now();
    const elapsed = (now - transfer.startTime) / 1000;
    const progress = transfer.sent / transfer.fileSize;
    const speed = transfer.sent / elapsed; // bytes per second
    const eta = speed > 0 ? (transfer.fileSize - transfer.sent) / speed : 0;
    
    const progressData = {
      fileId: transfer.fileId,
      fileName: transfer.fileName,
      progress,
      sent: transfer.sent,
      total: transfer.fileSize,
      speed,
      eta,
      elapsed
    };
    
    this.emit('progress', progressData);
  }
  
  // Receive files (receiver side)
  async receiveFiles(dataChannel, storageManager, options = {}) {
    const receivedFiles = new Map();
    let manifest = null;
    let currentFile = null;
    
    dataChannel.onmessage = async (event) => {
      try {
        // Try to parse as JSON (control messages)
        let message;
        try {
          message = JSON.parse(event.data);
        } catch {
          // Binary data (file chunk)
          if (currentFile) {
            await this.handleFileChunk(currentFile, event.data, storageManager);
          }
          return;
        }
        
        switch (message.type) {
          case 'manifest':
            manifest = message;
            await storageManager.prepareReceive(manifest);
            break;
            
          case 'file-start':
            currentFile = {
              ...message,
              received: 0,
              chunks: [],
              startTime: Date.now()
            };
            receivedFiles.set(message.fileId, currentFile);
            break;
            
          case 'chunk':
            // Chunk data will come in the next message
            if (currentFile && currentFile.fileId === message.fileId) {
              currentFile.expectedChunk = message;
            }
            break;
            
          case 'file-end':
            await this.completeFileReceive(message.fileId, receivedFiles, storageManager);
            break;
            
          case 'complete':
            this.emit('complete', { manifest, files: Array.from(receivedFiles.values()) });
            break;
        }
        
      } catch (error) {
        console.error('Error handling received data:', error);
        this.emit('error', { error: error.message });
      }
    };
  }
  
  // Handle received file chunk
  async handleFileChunk(file, chunkData, storageManager) {
    if (!file.expectedChunk) return;
    
    const { offset, size } = file.expectedChunk;
    
    // Verify chunk size
    if (chunkData.byteLength !== size) {
      throw new Error(`Chunk size mismatch: expected ${size}, got ${chunkData.byteLength}`);
    }
    
    // Write chunk to storage
    await storageManager.writeChunk(file.fileId, offset, chunkData);
    
    file.received += chunkData.byteLength;
    file.expectedChunk = null;
    
    // Update progress
    const progress = file.received / file.size;
    const elapsed = (Date.now() - file.startTime) / 1000;
    const speed = file.received / elapsed;
    const eta = speed > 0 ? (file.size - file.received) / speed : 0;
    
    this.emit('progress', {
      fileId: file.fileId,
      fileName: file.name,
      progress,
      received: file.received,
      total: file.size,
      speed,
      eta,
      elapsed
    });
  }
  
  // Complete file receive and verify
  async completeFileReceive(fileId, receivedFiles, storageManager) {
    const file = receivedFiles.get(fileId);
    if (!file) return;
    
    // Finalize file in storage
    await storageManager.finalizeFile(fileId, file);
    
    // Verify integrity if hash provided
    if (file.hash) {
      const calculatedHash = await storageManager.calculateFileHash(fileId);
      if (calculatedHash !== file.hash) {
        throw new Error(`File integrity check failed for ${file.name}`);
      }
    }
    
    console.log(`File received successfully: ${file.name}`);
  }
  
  // Get transfer statistics
  getTransferStats() {
    const stats = {
      activeTransfers: this.activeTransfers.size,
      totalSent: 0,
      totalReceived: 0
    };
    
    for (const transfer of this.activeTransfers.values()) {
      stats.totalSent += transfer.sent || 0;
      stats.totalReceived += transfer.received || 0;
    }
    
    return stats;
  }
  
  // Cancel transfer
  cancelTransfer(fileId) {
    this.activeTransfers.delete(fileId);
  }
  
  // Cancel all transfers
  cancelAllTransfers() {
    this.activeTransfers.clear();
  }
}