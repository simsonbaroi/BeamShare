import { useState, useCallback, useRef } from "react";

interface TransferState {
  progress: number;
  speed: number;
  timeRemaining: number;
  isTransferring: boolean;
  currentFileIndex: number;
  bytesTransferred: number;
}

export function useFileTransfer() {
  const [transferState, setTransferState] = useState<TransferState>({
    progress: 0,
    speed: 0,
    timeRemaining: 0,
    isTransferring: false,
    currentFileIndex: 0,
    bytesTransferred: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const transferStartTimeRef = useRef<number>(0);

  const startTransfer = useCallback(async (
    files: File[],
    sendData: (data: ArrayBuffer | string) => boolean
  ) => {
    abortControllerRef.current = new AbortController();
    transferStartTimeRef.current = Date.now();
    
    setTransferState(prev => ({
      ...prev,
      isTransferring: true,
      progress: 0,
      currentFileIndex: 0,
      bytesTransferred: 0
    }));

    try {
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      let transferredBytes = 0;

      // Send metadata first
      const metadata = {
        type: 'metadata',
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })),
        totalBytes
      };
      
      sendData(JSON.stringify(metadata));

      // Transfer files
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        if (abortControllerRef.current?.signal.aborted) break;

        const file = files[fileIndex];
        const chunkSize = 16 * 1024; // 16KB chunks
        let fileOffset = 0;

        setTransferState(prev => ({ ...prev, currentFileIndex: fileIndex }));

        // Send file header
        const fileHeader = {
          type: 'file-start',
          fileIndex,
          name: file.name,
          size: file.size
        };
        sendData(JSON.stringify(fileHeader));

        while (fileOffset < file.size) {
          if (abortControllerRef.current?.signal.aborted) break;

          const chunkEnd = Math.min(fileOffset + chunkSize, file.size);
          const chunk = file.slice(fileOffset, chunkEnd);
          const arrayBuffer = await chunk.arrayBuffer();

          // Send chunk with metadata
          const chunkData = {
            type: 'file-chunk',
            fileIndex,
            offset: fileOffset,
            data: Array.from(new Uint8Array(arrayBuffer))
          };

          sendData(JSON.stringify(chunkData));
          
          fileOffset = chunkEnd;
          transferredBytes += arrayBuffer.byteLength;

          // Update progress
          const progress = (transferredBytes / totalBytes) * 100;
          const elapsedTime = (Date.now() - transferStartTimeRef.current) / 1000;
          const speed = transferredBytes / elapsedTime;
          const remainingBytes = totalBytes - transferredBytes;
          const timeRemaining = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;

          setTransferState(prev => ({
            ...prev,
            progress,
            speed,
            timeRemaining,
            bytesTransferred: transferredBytes
          }));

          // Small delay to prevent overwhelming the data channel
          await new Promise(resolve => setTimeout(resolve, 1));
        }

        // Send file end marker
        const fileEnd = {
          type: 'file-end',
          fileIndex
        };
        sendData(JSON.stringify(fileEnd));
      }

      // Send transfer complete
      sendData(JSON.stringify({ type: 'transfer-complete' }));

      setTransferState(prev => ({
        ...prev,
        isTransferring: false,
        progress: 100
      }));

    } catch (error) {
      setTransferState(prev => ({ ...prev, isTransferring: false }));
      throw error;
    }
  }, []);

  const cancelTransfer = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setTransferState(prev => ({ ...prev, isTransferring: false }));
  }, []);

  return {
    transferProgress: transferState.progress,
    transferSpeed: transferState.speed,
    timeRemaining: transferState.timeRemaining,
    isTransferring: transferState.isTransferring,
    currentFileIndex: transferState.currentFileIndex,
    bytesTransferred: transferState.bytesTransferred,
    startTransfer,
    cancelTransfer
  };
}
