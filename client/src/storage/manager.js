// Storage Management for File Saving
export class StorageManager {
  constructor() {
    this.fsAccessSupported = 'showDirectoryPicker' in window;
    this.webShareSupported = 'share' in navigator;
    this.opfsSupported = 'storage' in navigator && 'getDirectory' in navigator.storage;
    
    this.directoryHandle = null;
    this.tempFiles = new Map();
  }
  
  // Initialize storage and check capabilities
  async init() {
    // Try to restore saved directory handle
    if (this.fsAccessSupported) {
      await this.restoreDirectoryHandle();
    }
  }
  
  // Check what storage methods are available
  getAvailableMethods() {
    return {
      fileSystemAccess: this.fsAccessSupported,
      webShare: this.webShareSupported,
      opfs: this.opfsSupported,
      download: true // Always available as fallback
    };
  }
  
  // Choose directory for saving files
  async chooseDirectory() {
    if (!this.fsAccessSupported) {
      throw new Error('File System Access API not supported');
    }
    
    try {
      this.directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      
      // Save handle for future use
      await this.saveDirectoryHandle();
      
      return this.directoryHandle;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Directory selection cancelled');
      }
      throw error;
    }
  }
  
  // Prepare for receiving files
  async prepareReceive(manifest) {
    console.log('Preparing to receive files:', manifest);
    
    // If we don't have a directory handle and FS Access is supported, prompt for one
    if (this.fsAccessSupported && !this.directoryHandle) {
      try {
        await this.chooseDirectory();
      } catch (error) {
        console.warn('Failed to choose directory, will use fallback methods:', error);
      }
    }
    
    // Prepare temp storage for each file
    for (const fileInfo of manifest.files) {
      this.tempFiles.set(fileInfo.id, {
        ...fileInfo,
        chunks: [],
        received: 0
      });
    }
  }
  
  // Write file chunk
  async writeChunk(fileId, offset, chunkData) {
    const file = this.tempFiles.get(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found in temp storage`);
    }
    
    // Store chunk with offset info
    file.chunks.push({
      offset,
      data: chunkData
    });
    
    file.received += chunkData.byteLength;
  }
  
  // Finalize file (reassemble chunks and save)
  async finalizeFile(fileId, fileInfo) {
    const file = this.tempFiles.get(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }
    
    // Sort chunks by offset
    file.chunks.sort((a, b) => a.offset - b.offset);
    
    // Reassemble file
    const totalSize = file.chunks.reduce((sum, chunk) => sum + chunk.data.byteLength, 0);
    const fileData = new Uint8Array(totalSize);
    let offset = 0;
    
    for (const chunk of file.chunks) {
      fileData.set(new Uint8Array(chunk.data), offset);
      offset += chunk.data.byteLength;
    }
    
    // Save file using best available method
    await this.saveFile(fileInfo.name, fileData, fileInfo.type);
    
    // Clean up temp storage
    this.tempFiles.delete(fileId);
  }
  
  // Save file using the best available method
  async saveFile(fileName, fileData, mimeType = 'application/octet-stream') {
    try {
      // Method 1: File System Access API (preferred)
      if (this.directoryHandle) {
        return await this.saveWithFSAccess(fileName, fileData, mimeType);
      }
      
      // Method 2: OPFS (temp storage)
      if (this.opfsSupported) {
        return await this.saveWithOPFS(fileName, fileData, mimeType);
      }
      
      // Method 3: Web Share API (mobile)
      if (this.webShareSupported && navigator.share) {
        return await this.saveWithWebShare(fileName, fileData, mimeType);
      }
      
      // Method 4: Download fallback
      return await this.saveWithDownload(fileName, fileData, mimeType);
      
    } catch (error) {
      console.error(`Failed to save file ${fileName}:`, error);
      
      // Always fallback to download
      return await this.saveWithDownload(fileName, fileData, mimeType);
    }
  }
  
  // Save using File System Access API
  async saveWithFSAccess(fileName, fileData, mimeType) {
    try {
      const fileHandle = await this.directoryHandle.getFileHandle(fileName, {
        create: true
      });
      
      const writable = await fileHandle.createWritable();
      await writable.write(fileData);
      await writable.close();
      
      console.log(`File saved to directory: ${fileName}`);
      return { method: 'fsaccess', path: fileName };
      
    } catch (error) {
      // Permission might have been revoked
      if (error.name === 'NotAllowedError') {
        this.directoryHandle = null;
        await this.clearSavedDirectoryHandle();
      }
      throw error;
    }
  }
  
  // Save using Origin Private File System
  async saveWithOPFS(fileName, fileData, mimeType) {
    const opfsRoot = await navigator.storage.getDirectory();
    const fileHandle = await opfsRoot.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    
    await writable.write(fileData);
    await writable.close();
    
    console.log(`File saved to OPFS: ${fileName}`);
    return { method: 'opfs', fileHandle };
  }
  
  // Save using Web Share API
  async saveWithWebShare(fileName, fileData, mimeType) {
    const file = new File([fileData], fileName, { type: mimeType });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Save ${fileName}`,
        text: `Received file: ${fileName}`
      });
      
      console.log(`File shared: ${fileName}`);
      return { method: 'webshare', fileName };
    } else {
      throw new Error('Web Share not supported for this file type');
    }
  }
  
  // Save using download fallback
  async saveWithDownload(fileName, fileData, mimeType) {
    const blob = new Blob([fileData], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    console.log(`File downloaded: ${fileName}`);
    return { method: 'download', fileName };
  }
  
  // Calculate file hash for verification
  async calculateFileHash(fileId) {
    const file = this.tempFiles.get(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }
    
    // Reassemble file data
    const totalSize = file.chunks.reduce((sum, chunk) => sum + chunk.data.byteLength, 0);
    const fileData = new Uint8Array(totalSize);
    let offset = 0;
    
    for (const chunk of file.chunks.sort((a, b) => a.offset - b.offset)) {
      fileData.set(new Uint8Array(chunk.data), offset);
      offset += chunk.data.byteLength;
    }
    
    // Calculate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Save directory handle to IndexedDB
  async saveDirectoryHandle() {
    if (!this.directoryHandle) return;
    
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['handles'], 'readwrite');
      const store = transaction.objectStore('handles');
      
      await store.put({
        id: 'directory',
        handle: this.directoryHandle
      });
      
    } catch (error) {
      console.warn('Failed to save directory handle:', error);
    }
  }
  
  // Restore directory handle from IndexedDB
  async restoreDirectoryHandle() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['handles'], 'readonly');
      const store = transaction.objectStore('handles');
      
      const result = await store.get('directory');
      if (result && result.handle) {
        // Verify permission
        const permission = await result.handle.queryPermission({ mode: 'readwrite' });
        if (permission === 'granted') {
          this.directoryHandle = result.handle;
        } else if (permission === 'prompt') {
          const newPermission = await result.handle.requestPermission({ mode: 'readwrite' });
          if (newPermission === 'granted') {
            this.directoryHandle = result.handle;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore directory handle:', error);
    }
  }
  
  // Clear saved directory handle
  async clearSavedDirectoryHandle() {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['handles'], 'readwrite');
      const store = transaction.objectStore('handles');
      
      await store.delete('directory');
    } catch (error) {
      console.warn('Failed to clear directory handle:', error);
    }
  }
  
  // Open IndexedDB
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('BeamShare', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('handles')) {
          db.createObjectStore('handles', { keyPath: 'id' });
        }
      };
    });
  }
  
  // Get storage info
  getStorageInfo() {
    return {
      hasDirectory: !!this.directoryHandle,
      directoryName: this.directoryHandle?.name || null,
      capabilities: this.getAvailableMethods(),
      tempFiles: this.tempFiles.size
    };
  }
}