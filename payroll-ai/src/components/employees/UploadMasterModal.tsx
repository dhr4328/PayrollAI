'use client';
// src/components/employees/UploadMasterModal.tsx
import { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (metadata: any) => void;
}

export function UploadMasterModal({ isOpen, onClose, onUploadSuccess }: UploadMasterModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setError("Please select an Excel file (.xlsx or .xls) only.");
      setSelectedFile(null);
      return false;
    }
    setError(null);
    setSelectedFile(file);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/api/employees/upload-master", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data = await response.json();
      setSuccessData(data);
      onUploadSuccess(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setUploading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setError(null);
    setSuccessData(null);
    setUploading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(15, 17, 23, 0.65)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: 'var(--radius-lg)',
        width: '460px',
        maxWidth: '90%',
        padding: '24px',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {successData ? 'Upload Successful' : 'Upload Employee Master'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {successData ? 'Database initialized with custom records' : 'Import your organization master sheet'}
            </p>
          </div>
          {!uploading && (
            <button 
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Content */}
        {successData ? (
          /* Success Screen */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--success-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success)',
            }}>
              <CheckCircle2 size={32} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {successData.record_count} Employee Records Loaded
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '320px' }}>
                Successfully loaded master database from <strong>{successData.original_filename}</strong>.
              </p>
            </div>
            
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              padding: '12px', 
              width: '100%', 
              fontSize: '11px',
              textAlign: 'left',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>File Name:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{successData.original_filename}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Loaded At:</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {new Date(successData.upload_date).toLocaleString()}
                </strong>
              </div>
            </div>

            <button
              onClick={handleClose}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                marginTop: '10px',
              }}
            >
              Done & Refresh Dashboard
            </button>
          </div>
        ) : (
          /* Upload/Drag Screen */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Error Alert */}
            {error && (
              <div style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                border: '1px solid #fee2e2',
                alignItems: 'flex-start',
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              style={{
                border: dragActive ? '2px dashed var(--primary)' : '2px dashed var(--border)',
                background: dragActive ? 'var(--primary-light)' : 'var(--content-bg)',
                borderRadius: 'var(--radius)',
                padding: '30px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleChange}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: selectedFile ? 'var(--primary-light)' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedFile ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {selectedFile ? <FileSpreadsheet size={20} /> : <Upload size={20} />}
              </div>

              {selectedFile ? (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to upload
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Drag & drop your Excel file here
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    or click to browse from device
                  </div>
                </div>
              )}
            </div>

            {/* Note / Instruction */}
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>• Template format: Excel sheet with employee details starting on row 5.</span>
              <span>• Col 3 (Emp Code), Col 4 (Name), Col 17 (Per Day Rate) must not be empty.</span>
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
              <a
                href="http://localhost:8000/api/employees/download-current"
                download
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  marginRight: 'auto',
                  cursor: 'pointer',
                }}
              >
                <Download size={13} />
                Download Template
              </a>

              <button
                disabled={uploading}
                onClick={handleClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'white',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                disabled={!selectedFile || uploading}
                onClick={handleUpload}
                style={{
                  padding: '8px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: !selectedFile || uploading ? 'var(--border)' : 'var(--primary)',
                  color: !selectedFile || uploading ? 'var(--text-muted)' : 'white',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {uploading && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {uploading ? 'Processing...' : 'Upload'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
