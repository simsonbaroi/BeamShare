// Utility functions for byte formatting and time calculations

export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatBytesPerSecond(bytesPerSecond) {
  if (bytesPerSecond === 0) return '0 B/s';
  
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatTime(seconds) {
  if (seconds === 0 || !isFinite(seconds)) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function formatTimeRemaining(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return 'calculating...';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `~${hours}h ${minutes}m remaining`;
  } else if (minutes > 0) {
    return `~${minutes}m ${secs}s remaining`;
  } else if (secs > 5) {
    return `~${secs}s remaining`;
  } else {
    return 'almost done...';
  }
}

export function calculateTransferSpeed(bytesTransferred, timeElapsedMs) {
  if (timeElapsedMs === 0) return 0;
  return bytesTransferred / (timeElapsedMs / 1000); // bytes per second
}

export function calculateETA(bytesRemaining, bytesPerSecond) {
  if (bytesPerSecond === 0 || bytesRemaining === 0) return 0;
  return bytesRemaining / bytesPerSecond; // seconds
}

export function formatProgress(completed, total) {
  if (total === 0) return '0%';
  const percentage = (completed / total) * 100;
  return percentage.toFixed(1) + '%';
}