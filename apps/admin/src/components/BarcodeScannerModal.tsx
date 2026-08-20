import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      // Small delay to ensure the DOM element is rendered
      const timeoutId = setTimeout(() => {
        if (!scannerRef.current) {
          const html5QrCode = new Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          
          html5QrCode.start(
            { facingMode: "environment" }, // Prefer back camera
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              // Successfully scanned a barcode
              if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                  scannerRef.current?.clear();
                  scannerRef.current = null;
                  onScan(decodedText);
                }).catch(console.error);
              }
            },
            (errorMessage) => {
              // Ignore standard scan errors
            }
          ).catch((err) => {
            console.error("Camera start error:", err);
            setError("Không thể truy cập camera. Vui lòng cấp quyền hoặc kiểm tra lại thiết bị.");
          });
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        if (scannerRef.current) {
          scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          }).catch(console.error);
        }
      };
    }
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg text-slate-800">Quét mã vạch</h3>
          <button 
            onClick={() => {
              if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                  scannerRef.current?.clear();
                  scannerRef.current = null;
                  onClose();
                }).catch((e) => {
                  console.error(e);
                  onClose();
                });
              } else {
                onClose();
              }
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 bg-slate-50">
          {error ? (
            <div className="w-full bg-red-50 text-red-600 p-4 rounded-lg text-center flex flex-col items-center gap-2">
              <Camera className="w-8 h-8 opacity-50" />
              <p className="font-medium">{error}</p>
            </div>
          ) : (
            <div id="reader" className="w-full bg-black rounded-lg overflow-hidden min-h-[300px]"></div>
          )}
          <p className="text-center text-sm text-slate-500 mt-4">
            Đưa mã vạch của sản phẩm vào ô camera để quét
          </p>
        </div>
      </div>
    </div>
  );
}
