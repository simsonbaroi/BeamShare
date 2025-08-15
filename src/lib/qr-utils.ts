import QRCode from 'qrcode';

interface PairingData {
  type: 'offer' | 'answer';
  sdp: string;
  encryptionKey?: string;
  timestamp: number;
}

export async function generatePairingCode(data: Omit<PairingData, 'timestamp'>): Promise<string> {
  const pairingData: PairingData = {
    ...data,
    timestamp: Date.now()
  };

  const compressed = await compressData(JSON.stringify(pairingData));
  return btoa(compressed);
}

export async function parsePairingCode(code: string): Promise<PairingData> {
  try {
    const compressed = atob(code);
    const decompressed = await decompressData(compressed);
    const data = JSON.parse(decompressed);
    
    // Check if the code is not too old (10 minutes)
    if (Date.now() - data.timestamp > 10 * 60 * 1000) {
      throw new Error('Pairing code has expired');
    }
    
    return data;
  } catch (error) {
    throw new Error('Invalid pairing code');
  }
}

export async function generateQRCode(data: string, canvas: HTMLCanvasElement): Promise<void> {
  try {
    await QRCode.toCanvas(canvas, data, {
      width: 192,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

export async function startQRScanner(
  video: HTMLVideoElement,
  onResult: (result: string) => void
): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    video.srcObject = stream;
    
    // Import QR scanner dynamically
    const { default: QrScanner } = await import('qr-scanner');
    const qrScanner = new QrScanner(
      video,
      (result) => {
        onResult(result.data);
        qrScanner.stop();
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    await qrScanner.start();
    
    // Store scanner instance for cleanup
    (video as any).__qrScanner = qrScanner;
  } catch (error) {
    console.error('Error starting QR scanner:', error);
    throw error;
  }
}

export function stopQRScanner(video: HTMLVideoElement): void {
  const qrScanner = (video as any).__qrScanner;
  if (qrScanner) {
    qrScanner.stop();
    qrScanner.destroy();
    delete (video as any).__qrScanner;
  }

  const stream = video.srcObject as MediaStream;
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
}

// Simple compression using built-in compression (when available)
async function compressData(data: string): Promise<string> {
  if ('CompressionStream' in window) {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    const encoder = new TextEncoder();
    writer.write(encoder.encode(data));
    writer.close();

    const chunks: Uint8Array[] = [];
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

    return String.fromCharCode(...compressed);
  }
  
  // Fallback: no compression
  return data;
}

async function decompressData(data: string): Promise<string> {
  if ('DecompressionStream' in window) {
    try {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      const compressed = new Uint8Array(data.split('').map(char => char.charCodeAt(0)));
      writer.write(compressed);
      writer.close();

      const chunks: Uint8Array[] = [];
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
    } catch {
      // If decompression fails, assume it's uncompressed
      return data;
    }
  }
  
  // Fallback: no decompression
  return data;
}
