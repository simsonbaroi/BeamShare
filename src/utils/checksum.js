// Checksum utilities for file integrity verification
export async function calculateSHA256(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function calculateSHA256FromBuffer(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function streamingSHA256(readableStream) {
  const reader = readableStream.getReader();
  const hasher = new SHA256Hasher();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      hasher.update(value);
    }
    
    return hasher.finalize();
  } finally {
    reader.releaseLock();
  }
}

class SHA256Hasher {
  constructor() {
    this.chunks = [];
    this.totalLength = 0;
  }
  
  update(chunk) {
    this.chunks.push(new Uint8Array(chunk));
    this.totalLength += chunk.byteLength;
  }
  
  async finalize() {
    // Combine all chunks
    const combined = new Uint8Array(this.totalLength);
    let offset = 0;
    
    for (const chunk of this.chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }
    
    // Calculate hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}