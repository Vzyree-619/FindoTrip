import { useState, useRef } from "react";
import { 
  Upload, 
  File, 
  X, 
  Check, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon,
  Download,
  Eye
} from "lucide-react";

interface DocumentUploadProps {
  documentType: string;
  label: string;
  description?: string;
  required?: boolean;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  onUpload?: (file: File) => void;
  onRemove?: () => void;
  existingDocument?: {
    name: string;
    url: string;
    verified?: boolean;
  };
  className?: string;
}

export function DocumentUpload({
  documentType,
  label,
  description,
  required = false,
  acceptedTypes = ['.pdf', '.jpg', '.jpeg', '.png'],
  maxSize = 5,
  onUpload,
  onRemove,
  existingDocument,
  className = ""
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError("");
    
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      setError(`File type not supported. Please upload: ${acceptedTypes.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setUploading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadedFile(file);
      onUpload?.(file);
    } catch (err) {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    setError("");
    onRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-red-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const hasDocument = uploadedFile || existingDocument;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {existingDocument?.verified && (
          <div className="flex items-center text-green-600 text-sm">
            <Check className="h-4 w-4 mr-1" />
            Verified
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {/* Upload Area */}
      {!hasDocument && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : error
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required={required}
          />
          
          <div className="text-center">
            <Upload className={`mx-auto h-12 w-12 ${error ? 'text-red-400' : 'text-gray-400'}`} />
            <div className="mt-4">
              <button
                type="button"
                onClick={openFileDialog}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Click to upload
              </button>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {acceptedTypes.join(', ').toUpperCase()} up to {maxSize}MB
            </p>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Uploaded File Display */}
      {uploadedFile && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(uploadedFile.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(uploadedFile.size)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-1" />
                <span className="text-sm">Uploaded</span>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-800 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Document Display */}
      {existingDocument && !uploadedFile && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(existingDocument.name)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {existingDocument.name}
                </p>
                <p className="text-sm text-gray-500">
                  {existingDocument.verified ? 'Verified document' : 'Pending verification'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => window.open(existingDocument.url, '_blank')}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="View document"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = existingDocument.url;
                  link.download = existingDocument.name;
                  link.click();
                }}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Download document"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={openFileDialog}
                className="text-gray-600 hover:text-gray-800 p-1"
                title="Replace document"
              >
                <Upload className="h-4 w-4" />
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleChange}
            className="hidden"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden input for form submission */}
      {uploadedFile && (
        <input
          type="hidden"
          name={`document_${documentType}`}
          value={uploadedFile.name}
        />
      )}
    </div>
  );
}

// Verification Status Badge Component
export function VerificationBadge({ 
  status, 
  className = "" 
}: { 
  status: 'pending' | 'verified' | 'rejected'; 
  className?: string;
}) {
  const statusConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertCircle,
      text: 'Pending Verification'
    },
    verified: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: Check,
      text: 'Verified'
    },
    rejected: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: X,
      text: 'Rejected'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.text}
    </div>
  );
}

// Document Requirements Info Component
export function DocumentRequirements({ 
  documents, 
  className = "" 
}: { 
  documents: Array<{
    type: string;
    label: string;
    required: boolean;
    description?: string;
  }>; 
  className?: string;
}) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <FileText className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Required Documents
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            {documents.map((doc, index) => (
              <li key={index} className="flex items-start">
                <span className={`inline-block w-2 h-2 rounded-full mt-2 mr-2 flex-shrink-0 ${
                  doc.required ? 'bg-red-400' : 'bg-blue-400'
                }`} />
                <div>
                  <span className="font-medium">{doc.label}</span>
                  {doc.required && <span className="text-red-600 ml-1">*</span>}
                  {doc.description && (
                    <p className="text-blue-600 text-xs mt-0.5">{doc.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-blue-600 mt-3">
            * Required documents must be uploaded for account verification
          </p>
        </div>
      </div>
    </div>
  );
}
