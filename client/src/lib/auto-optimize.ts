// Automatic optimization for the fastest possible transfers
import { PerformanceOptimizer } from './performance';

export class AutoOptimizer {
  private optimizer = PerformanceOptimizer.getInstance();
  private isOptimized = false;
  
  // One-click optimization - automatically configure everything for best performance
  async optimizeForSpeed() {
    if (this.isOptimized) return;
    
    // Optimize WebRTC configuration
    this.optimizeWebRTC();
    
    // Optimize file transfer settings
    this.optimizeTransfer();
    
    // Optimize UI responsiveness
    this.optimizeUI();
    
    // Pre-warm connections
    await this.preWarmConnections();
    
    this.isOptimized = true;
    console.log('🚀 BeamShare optimized for maximum speed!');
  }
  
  private optimizeWebRTC() {
    // Configure for fastest connection establishment
    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' }
      ],
      iceCandidatePoolSize: 20,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };
    
    // Store optimal config for use
    (window as any).beamshareOptimalRTC = rtcConfig;
  }
  
  private optimizeTransfer() {
    const config = this.optimizer.getOptimalConfig();
    
    // Store optimal transfer settings
    (window as any).beamshareOptimalTransfer = {
      chunkSize: config.chunkSize,
      maxBuffer: config.bufferSize,
      concurrency: config.concurrency,
      useCompression: config.compression
    };
  }
  
  private optimizeUI() {
    // Reduce visual effects during transfer for performance
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    
    // Optimize for 60fps
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      (window as any).beamshareUseScheduler = true;
    }
  }
  
  private async preWarmConnections() {
    // Pre-resolve STUN servers
    const stunServers = [
      'stun.l.google.com',
      'stun.cloudflare.com'
    ];
    
    const promises = stunServers.map(server => {
      return new Promise(resolve => {
        const img = new Image();
        img.onload = img.onerror = () => resolve(null);
        img.src = `https://${server}/favicon.ico`;
        setTimeout(() => resolve(null), 1000); // Timeout after 1s
      });
    });
    
    await Promise.allSettled(promises);
  }
  
  // Get the best possible configuration
  getBestConfig() {
    return {
      rtc: (window as any).beamshareOptimalRTC,
      transfer: (window as any).beamshareOptimalTransfer,
      ui: (window as any).beamshareUseScheduler
    };
  }
  
  // Quick connection test
  async testConnectionSpeed(): Promise<number> {
    const start = performance.now();
    
    try {
      // Quick connection test to estimate speed
      const response = await fetch('https://www.gstatic.com/hostedimg/382a91be0531e463_small', {
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      const end = performance.now();
      const duration = end - start;
      
      // Rough speed estimation (lower is better for latency)
      return duration;
    } catch (error) {
      return 1000; // Default to conservative estimate
    }
  }
}

// Initialize auto-optimizer when module loads
const autoOptimizer = new AutoOptimizer();

// Export singleton instance
export default autoOptimizer;