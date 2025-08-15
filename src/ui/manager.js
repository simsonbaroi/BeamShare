// UI Manager for Dynamic Screen Management
export class UIManager {
  constructor() {
    this.currentScreen = null;
    this.state = null;
  }
  
  init(appState) {
    this.state = appState;
  }
  
  // Initialize sender screen
  async initSenderScreen(callbacks) {
    const senderScreen = document.getElementById('sender-screen');
    senderScreen.innerHTML = this.renderSenderScreen();
    
    // File selection handlers
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileList = document.getElementById('file-list');
    
    // File input change
    fileInput.addEventListener('change', (e) => {
      callbacks.onFilesSelected(e.target.files);
      this.updateFileList(Array.from(e.target.files));
    });
    
    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-400', 'bg-blue-50', 'dark:bg-blue-900');
      
      const files = Array.from(e.dataTransfer.files);
      callbacks.onFilesSelected(files);
      this.updateFileList(files);
    });
    
    // Start transfer button
    document.getElementById('start-transfer-btn').addEventListener('click', callbacks.onStartTransfer);
    
    // Back button
    document.getElementById('back-btn').addEventListener('click', callbacks.onBack);
  }
  
  // Initialize receiver screen
  async initReceiverScreen(callbacks) {
    const receiverScreen = document.getElementById('receiver-screen');
    receiverScreen.innerHTML = this.renderReceiverScreen();
    
    // QR scanner
    const scanBtn = document.getElementById('scan-qr-btn');
    const pasteInput = document.getElementById('paste-input');
    const connectBtn = document.getElementById('connect-btn');
    
    scanBtn.addEventListener('click', () => this.startQRScan(callbacks.onPairingCode));
    
    pasteInput.addEventListener('input', (e) => {
      connectBtn.disabled = !e.target.value.trim();
    });
    
    connectBtn.addEventListener('click', () => {
      const code = pasteInput.value.trim();
      if (code) {
        callbacks.onPairingCode(code);
      }
    });
    
    // Back button
    document.getElementById('back-btn').addEventListener('click', callbacks.onBack);
  }
  
  // Show pairing code for sender
  async showPairingCode(pairingCode) {
    const container = document.getElementById('sender-screen');
    container.innerHTML = this.renderPairingCodeScreen(pairingCode);
    
    // Generate QR code
    try {
      const qr = qrcode(0, 'M');
      qr.addData(pairingCode);
      qr.make();
      
      const qrContainer = document.getElementById('qr-code');
      qrContainer.innerHTML = qr.createImgTag(4, 8);
      
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
    
    // Copy button
    document.getElementById('copy-code-btn').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pairingCode);
        this.showToast('Pairing code copied to clipboard');
      } catch (error) {
        console.error('Failed to copy:', error);
        this.showToast('Failed to copy code', 'error');
      }
    });
  }
  
  // Show pairing response for receiver
  async showPairingResponse(responseCode, pairingData) {
    const container = document.getElementById('receiver-screen');
    container.innerHTML = this.renderPairingResponseScreen(responseCode, pairingData);
    
    // Generate QR code for response
    try {
      const qr = qrcode(0, 'M');
      qr.addData(responseCode);
      qr.make();
      
      const qrContainer = document.getElementById('response-qr-code');
      qrContainer.innerHTML = qr.createImgTag(4, 8);
      
    } catch (error) {
      console.error('Failed to generate response QR code:', error);
    }
    
    // Ready button
    document.getElementById('ready-btn').addEventListener('click', () => {
      document.getElementById('ready-btn').textContent = 'Ready!';
      document.getElementById('ready-btn').disabled = true;
      // Callback will be handled by main app
    });
  }
  
  // Start QR scanner
  async startQRScan(onScan) {
    try {
      const video = document.createElement('video');
      video.style.width = '100%';
      video.style.height = '300px';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '8px';
      
      const modal = this.createModal('Scan QR Code', video);
      document.body.appendChild(modal);
      
      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      video.srcObject = stream;
      video.play();
      
      // Use QR Scanner
      const qrScanner = new QrScanner(video, 
        (result) => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
          onScan(result.data);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true
        }
      );
      
      qrScanner.start();
      
      // Close button
      modal.querySelector('.close-btn').addEventListener('click', () => {
        qrScanner.stop();
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      });
      
    } catch (error) {
      console.error('Failed to start QR scanner:', error);
      this.showToast('Camera access denied or not available', 'error');
    }
  }
  
  // Initialize transfer screen
  initTransferScreen(callbacks) {
    const transferScreen = document.getElementById('transfer-screen');
    transferScreen.innerHTML = this.renderTransferScreen();
  }
  
  // Initialize complete screen
  initCompleteScreen(callbacks) {
    const completeScreen = document.getElementById('complete-screen');
    completeScreen.innerHTML = this.renderCompleteScreen();
    
    document.getElementById('new-transfer-btn').addEventListener('click', callbacks.onNewTransfer);
  }
  
  // Update file list display
  updateFileList(files) {
    const fileList = document.getElementById('file-list');
    if (!fileList) return;
    
    if (files.length === 0) {
      fileList.innerHTML = '<p class="text-gray-500">No files selected</p>';
      return;
    }
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    fileList.innerHTML = `
      <div class="space-y-2">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-medium text-white">Selected Files (${files.length})</h3>
          <span class="text-sm text-gray-300">${this.formatBytes(totalSize)}</span>
        </div>
        ${files.map(file => `
          <div class="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm4 5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-1.5 3a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
                </svg>
              </div>
              <div>
                <p class="text-white font-medium">${file.name}</p>
                <p class="text-sm text-gray-400">${this.formatBytes(file.size)}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  // Render screens
  renderSenderScreen() {
    return `
      <div class="max-w-4xl mx-auto">
        <div class="flex items-center mb-8">
          <button id="back-btn" class="btn btn-secondary mr-4" data-testid="button-back">
            ← Back
          </button>
          <h1 class="text-3xl font-bold text-white" data-testid="text-sender-header">Send Files</h1>
        </div>
        
        <div class="card mb-8">
          <h2 class="text-xl font-semibold text-white mb-6" data-testid="text-select-files">Select Files to Send</h2>
          
          <!-- File Input -->
          <div class="mb-6">
            <input 
              type="file" 
              id="file-input" 
              data-testid="input-file-select"
              multiple 
              class="hidden" 
            />
            <label for="file-input" class="btn btn-primary cursor-pointer inline-block">
              Choose Files
            </label>
          </div>
          
          <!-- Drop Zone -->
          <div 
            id="drop-zone" 
            data-testid="zone-file-drop"
            class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
          >
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M16.88 9.1A4 4 0 01.5 12.75v-2.5a4 4 0 014-4h1.5V5.5a2.5 2.5 0 115 0v.75H13a4 4 0 014 4v2.5c0-.15-.02-.3-.05-.44z"/>
            </svg>
            <p class="text-white mb-2">Drag and drop files here</p>
            <p class="text-gray-400 text-sm">or click "Choose Files" above</p>
          </div>
          
          <!-- File List -->
          <div id="file-list" data-testid="list-selected-files" class="mt-6">
            <p class="text-gray-500">No files selected</p>
          </div>
          
          <!-- Start Transfer -->
          <div class="mt-8 text-center">
            <button 
              id="start-transfer-btn" 
              data-testid="button-start-transfer"
              class="btn btn-success text-lg px-8 py-3"
              disabled
            >
              Generate Pairing Code
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderReceiverScreen() {
    return `
      <div class="max-w-2xl mx-auto">
        <div class="flex items-center mb-8">
          <button id="back-btn" class="btn btn-secondary mr-4" data-testid="button-back">
            ← Back
          </button>
          <h1 class="text-3xl font-bold text-white" data-testid="text-receiver-header">Receive Files</h1>
        </div>
        
        <div class="card">
          <h2 class="text-xl font-semibold text-white mb-6" data-testid="text-connect-sender">Connect to Sender</h2>
          
          <!-- QR Scanner -->
          <div class="text-center mb-8">
            <button 
              id="scan-qr-btn" 
              data-testid="button-scan-qr"
              class="btn btn-primary text-lg px-8 py-3"
            >
              📷 Scan QR Code
            </button>
          </div>
          
          <div class="text-center mb-6">
            <span class="text-gray-400">or</span>
          </div>
          
          <!-- Manual Code Input -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2" for="paste-input">
                Paste Pairing Code
              </label>
              <textarea 
                id="paste-input" 
                data-testid="input-pairing-code"
                rows="3"
                placeholder="Paste the pairing code from sender..."
                class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              ></textarea>
            </div>
            
            <button 
              id="connect-btn" 
              data-testid="button-connect"
              class="btn btn-success w-full"
              disabled
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    `;
  }
  
  renderPairingCodeScreen(pairingCode) {
    return `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-4" data-testid="text-pairing-title">Share This Code</h1>
          <p class="text-gray-300" data-testid="text-pairing-subtitle">The receiver should scan this QR code or copy the text below</p>
        </div>
        
        <div class="card text-center">
          <!-- QR Code -->
          <div id="qr-code" data-testid="img-qr-code" class="bg-white p-6 rounded-lg inline-block mb-6"></div>
          
          <!-- Text Code -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-2">Pairing Code</label>
            <div class="bg-gray-700 border border-gray-600 rounded-lg p-4 font-mono text-sm text-white break-all">
              ${pairingCode}
            </div>
          </div>
          
          <!-- Copy Button -->
          <button 
            id="copy-code-btn" 
            data-testid="button-copy-code"
            class="btn btn-primary mb-6"
          >
            📋 Copy Code
          </button>
          
          <!-- Status -->
          <div class="text-center">
            <div class="pulse-ring absolute w-4 h-4 rounded-full bg-blue-400 opacity-75 mx-auto"></div>
            <div class="w-4 h-4 rounded-full bg-blue-600 mx-auto mb-2"></div>
            <p class="text-gray-300" data-testid="text-waiting-status">Waiting for receiver to connect...</p>
          </div>
        </div>
      </div>
    `;
  }
  
  renderPairingResponseScreen(responseCode, pairingData) {
    return `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-4" data-testid="text-response-title">Show This to Sender</h1>
          <p class="text-gray-300" data-testid="text-response-subtitle">The sender should scan this QR code to complete the connection</p>
        </div>
        
        <div class="card text-center">
          <!-- Response QR Code -->
          <div id="response-qr-code" data-testid="img-response-qr" class="bg-white p-6 rounded-lg inline-block mb-6"></div>
          
          <!-- File Info -->
          <div class="mb-6 text-left">
            <h3 class="text-lg font-semibold text-white mb-4">Files to Receive:</h3>
            ${pairingData.files ? pairingData.files.map(file => `
              <div class="flex justify-between items-center p-2 bg-gray-700 rounded mb-2">
                <span class="text-white">${file.name}</span>
                <span class="text-gray-400 text-sm">${this.formatBytes(file.size)}</span>
              </div>
            `).join('') : '<p class="text-gray-400">File information not available</p>'}
          </div>
          
          <!-- Ready Button -->
          <button 
            id="ready-btn" 
            data-testid="button-ready"
            class="btn btn-success text-lg px-8 py-3"
          >
            I'm Ready to Receive
          </button>
        </div>
      </div>
    `;
  }
  
  renderTransferScreen() {
    return `
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-white mb-4" data-testid="text-transfer-title">File Transfer in Progress</h1>
          <p class="text-gray-300" data-testid="text-transfer-subtitle">Please keep this page open until transfer completes</p>
        </div>
        
        <div class="card">
          <div id="transfer-progress" data-testid="container-transfer-progress">
            <!-- Progress will be updated dynamically -->
          </div>
        </div>
      </div>
    `;
  }
  
  renderCompleteScreen() {
    return `
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-8">
          <div class="w-24 h-24 bg-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
            <svg class="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-white mb-4" data-testid="text-complete-title">Transfer Complete!</h1>
          <p class="text-gray-300" data-testid="text-complete-subtitle">All files have been transferred successfully</p>
        </div>
        
        <div class="card text-center">
          <button 
            id="new-transfer-btn" 
            data-testid="button-new-transfer"
            class="btn btn-primary text-lg px-8 py-3"
          >
            Start New Transfer
          </button>
        </div>
      </div>
    `;
  }
  
  // Utility methods
  createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="glass-strong p-6 rounded-lg max-w-md w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-white">${title}</h3>
          <button class="close-btn text-gray-400 hover:text-white">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        <div class="modal-content"></div>
      </div>
    `;
    
    modal.querySelector('.modal-content').appendChild(content);
    return modal;
  }
  
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${
      type === 'error' ? 'bg-red-600' : 'bg-green-600'
    }`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  }
  
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}