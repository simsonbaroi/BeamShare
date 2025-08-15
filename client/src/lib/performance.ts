// Performance optimization utilities for BeamShare
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private connectionMetrics: Map<string, any> = new Map();
  
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }
  
  // Detect optimal configuration based on device and network
  getOptimalConfig() {
    const config = {
      chunkSize: this.getOptimalChunkSize(),
      concurrency: this.getOptimalConcurrency(),
      bufferSize: this.getOptimalBufferSize(),
      compression: this.shouldUseCompression()
    };
    
    return config;
  }
  
  private getOptimalChunkSize(): number {
    // Network-aware chunk sizing
    const connection = (navigator as any).connection;
    const memory = (navigator as any).deviceMemory || 4;
    
    let baseSize = 64 * 1024; // 64KB default
    
    if (connection?.effectiveType) {
      switch (connection.effectiveType) {
        case '4g': baseSize = 512 * 1024; break; // 512KB
        case '3g': baseSize = 128 * 1024; break; // 128KB
        case '2g': baseSize = 32 * 1024; break;  // 32KB
        default: baseSize = 256 * 1024; break;   // 256KB for WiFi/unknown
      }
    }
    
    // Memory-based adjustment
    if (memory >= 8) baseSize *= 2;
    else if (memory <= 2) baseSize = Math.max(baseSize / 2, 16 * 1024);
    
    return Math.min(baseSize, 2 * 1024 * 1024); // Cap at 2MB
  }
  
  private getOptimalConcurrency(): number {
    const cores = navigator.hardwareConcurrency || 4;
    return Math.min(Math.max(cores / 2, 2), 8); // Between 2-8 parallel operations
  }
  
  private getOptimalBufferSize(): number {
    const memory = (navigator as any).deviceMemory || 4;
    if (memory >= 8) return 64 * 1024 * 1024; // 64MB for high-end devices
    if (memory >= 4) return 32 * 1024 * 1024; // 32MB for mid-range
    return 16 * 1024 * 1024; // 16MB for low-end devices
  }
  
  private shouldUseCompression(): boolean {
    // Use compression on slower connections
    const connection = (navigator as any).connection;
    return connection?.effectiveType === '3g' || connection?.effectiveType === '2g';
  }
  
  // Monitor transfer performance and adjust
  updateMetrics(transferId: string, metrics: any) {
    this.connectionMetrics.set(transferId, {
      ...this.connectionMetrics.get(transferId),
      ...metrics,
      timestamp: Date.now()
    });
  }
  
  // Get adaptive chunk size based on current performance
  getAdaptiveChunkSize(transferId: string): number {
    const metrics = this.connectionMetrics.get(transferId);
    if (!metrics) return this.getOptimalChunkSize();
    
    const { speed, latency } = metrics;
    let baseSize = this.getOptimalChunkSize();
    
    // Adjust based on measured performance
    if (speed && speed > 1024 * 1024) { // > 1MB/s
      baseSize = Math.min(baseSize * 2, 2 * 1024 * 1024);
    } else if (speed && speed < 128 * 1024) { // < 128KB/s
      baseSize = Math.max(baseSize / 2, 16 * 1024);
    }
    
    if (latency && latency > 200) { // High latency
      baseSize = Math.max(baseSize / 1.5, 32 * 1024);
    }
    
    return Math.floor(baseSize);
  }
}