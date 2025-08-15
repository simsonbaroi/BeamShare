import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { File, Folder, Upload, QrCode, X } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface FileSelectorProps {
  selectedFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onCreatePairingCode: () => void;
}

export function FileSelector({ selectedFiles, onFilesSelected, onCreatePairingCode }: FileSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (allowDirectories = false) => {
    if (fileInputRef.current) {
      fileInputRef.current.webkitdirectory = allowDirectories;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    onFilesSelected([...selectedFiles, ...files]);
    // Reset input to allow selecting the same files again
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = Array.from(event.dataTransfer.files);
    onFilesSelected([...selectedFiles, ...files]);
    
    const dropZone = event.currentTarget;
    dropZone.classList.remove('drag-over');
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget;
    dropZone.classList.add('drag-over');
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const dropZone = event.currentTarget;
    dropZone.classList.remove('drag-over');
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesSelected(newFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.startsWith('video/')) return '🎥';
    if (file.type.startsWith('audio/')) return '🎵';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('zip') || file.type.includes('rar')) return '📦';
    return '📄';
  };

  return (
    <Card className="glass">
      <CardContent className="p-8">
        <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
          <Folder className="mr-3 text-emerald-500" />
          Select Files to Share
        </h3>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
          data-testid="file-input"
        />
        
        {/* File Selection Buttons */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Button
            onClick={() => handleFileSelect(false)}
            className="flex items-center justify-center bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            data-testid="button-select-files"
          >
            <File className="mr-3 h-4 w-4" />
            Choose Files
          </Button>
          <Button
            onClick={() => handleFileSelect(true)}
            className="flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            data-testid="button-select-folder"
          >
            <Folder className="mr-3 h-4 w-4" />
            Choose Folder
          </Button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          className="file-drop-zone border-2 border-dashed border-emerald-400/40 p-8 rounded-xl text-center mb-6 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-50/10"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          data-testid="file-drop-zone"
        >
          <Upload className="text-4xl text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">Drag and drop files here</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">or use the buttons above</p>
        </div>
        
        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="font-semibold text-gray-800 dark:text-white">Selected Files ({selectedFiles.length})</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/30 rounded-lg"
                  data-testid={`file-item-${index}`}
                >
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getFileIcon(file)}</span>
                    <div>
                      <span className="font-medium text-gray-800 dark:text-white">{file.name}</span>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    data-testid={`button-remove-file-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Create Pairing Code Button */}
        <Button
          onClick={onCreatePairingCode}
          disabled={selectedFiles.length === 0}
          className="w-full bg-gradient-to-r from-emerald-500 to-purple-500 hover:from-emerald-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="button-create-pairing-code"
        >
          <QrCode className="mr-3 h-4 w-4" />
          Create Pairing Code
        </Button>
      </CardContent>
    </Card>
  );
}
