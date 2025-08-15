// Serverless Signaling via QR Codes
export class SignalingManager {
  constructor() {
    this.compressionEnabled = true;
  }
  
  // Create pairing code from SDP and metadata
  async createPairingCode(data) {
    try {
      const pairingData = {
        version: '1.0',
        timestamp: Date.now(),
        ...data
      };
      
      let jsonString = JSON.stringify(pairingData);
      
      // Compress if enabled and beneficial
      if (this.compressionEnabled && jsonString.length > 500) {
        jsonString = await this.compress(jsonString);
      }
      
      // Encode for QR code
      return btoa(jsonString);
      
    } catch (error) {
      console.error('Failed to create pairing code:', error);
      throw new Error('Failed to generate pairing code');
    }
  }
  
  // Parse pairing code back to data
  async parsePairingCode(code) {
    try {
      // Decode from base64
      let jsonString = atob(code);
      
      // Decompress if needed
      if (this.isCompressed(jsonString)) {
        jsonString = await this.decompress(jsonString);
      }
      
      const data = JSON.parse(jsonString);
      
      // Validate pairing data
      if (!data.version || !data.role || !data.sdp) {
        throw new Error('Invalid pairing data');
      }
      
      return data;
      
    } catch (error) {
      console.error('Failed to parse pairing code:', error);
      throw new Error('Invalid or corrupted pairing code');
    }
  }
  
  // Generate QR code for pairing data
  async generateQRCode(pairingCode, size = 256) {
    try {
      // Create QR code using qrcode library
      const qr = qrcode(0, 'M');
      qr.addData(pairingCode);
      qr.make();
      
      return qr.createDataURL(4, 8);
      
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }
  
  // Scan QR code from camera
  async scanQRCode(videoElement) {
    return new Promise((resolve, reject) => {
      try {
        const qrScanner = new QrScanner(videoElement, 
          (result) => {
            qrScanner.stop();
            resolve(result.data);
          },
          {
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            highlightCodeOutline: true
          }
        );
        
        qrScanner.start().catch(reject);
        
        // Auto-stop after 30 seconds
        setTimeout(() => {
          qrScanner.stop();
          reject(new Error('QR scan timeout'));
        }, 30000);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // Request camera permissions
  async requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Camera permission denied:', error);
      return false;
    }
  }
  
  // Check if camera is available
  async isCameraAvailable() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.some(device => device.kind === 'videoinput');
    } catch (error) {
      return false;
    }
  }
  
  // Simple compression using gzip-like algorithm
  async compress(str) {
    try {
      // Use CompressionStream if available (modern browsers)
      if ('CompressionStream' in window) {
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        writer.write(new TextEncoder().encode(str));
        writer.close();
        
        const chunks = [];
        let done = false;
        
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) chunks.push(value);
        }
        
        const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          compressed.set(chunk, offset);
          offset += chunk.length;
        }
        
        return 'GZIP:' + btoa(String.fromCharCode(...compressed));
      } else {
        // Fallback to simple compression
        return 'SIMPLE:' + str.replace(/\s+/g, ' ');
      }
    } catch (error) {
      console.warn('Compression failed, using original:', error);
      return str;
    }
  }
  
  // Decompress data
  async decompress(str) {
    try {
      if (str.startsWith('GZIP:')) {
        // Use DecompressionStream if available
        if ('DecompressionStream' in window) {
          const compressed = new Uint8Array(
            atob(str.slice(5))
              .split('')
              .map(char => char.charCodeAt(0))
          );
          
          const stream = new DecompressionStream('gzip');
          const writer = stream.writable.getWriter();
          const reader = stream.readable.getReader();
          
          writer.write(compressed);
          writer.close();
          
          const chunks = [];
          let done = false;
          
          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) chunks.push(value);
          }
          
          const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
          let offset = 0;
          for (const chunk of chunks) {
            decompressed.set(chunk, offset);
            offset += chunk.length;
          }
          
          return new TextDecoder().decode(decompressed);
        }
      } else if (str.startsWith('SIMPLE:')) {
        return str.slice(7);
      }
      
      return str;
    } catch (error) {
      console.warn('Decompression failed:', error);
      return str;
    }
  }
  
  // Check if data is compressed
  isCompressed(str) {
    return str.startsWith('GZIP:') || str.startsWith('SIMPLE:');
  }
  
  // Validate SDP
  validateSDP(sdp) {
    if (!sdp || typeof sdp !== 'object') {
      return false;
    }
    
    return sdp.type && sdp.sdp && 
           ['offer', 'answer'].includes(sdp.type) &&
           typeof sdp.sdp === 'string';
  }
}