import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import qrScannerWorkerSource from 'qr-scanner/qr-scanner-worker.min.js?url';
import { ArrowLeft, Camera, ShieldAlert, Monitor, Keyboard, ArrowRight } from 'lucide-react';

// Set the worker path so qr-scanner can load it correctly in Vite
QrScanner.WORKER_PATH = qrScannerWorkerSource;

const Scanner = () => {
  const [error, setError] = useState('');
  const [manualId, setManualId] = useState('');
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    const videoElem = videoRef.current;
    if (!videoElem) return;

    const qrScanner = new QrScanner(
      videoElem,
      (result) => {
        const scannedText = typeof result === 'object' ? (result.data || result.text || '') : result;
        if (scannedText) handleScan(scannedText);
      },
      {
        onDecodeError: () => {}, // Silently ignore decode errors during camera scanning
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      }
    );

    qrScanner.start().catch((err) => {
      console.error("QR Scanner failed to start:", err);
      setError('Failed to access camera. Please grant camera permissions and try again.');
    });

    qrScannerRef.current = qrScanner;

    return () => {
      qrScanner.destroy();
    };
  }, []);

  const handleScan = (scannedText) => {
    try {
      let assetId = '';
      if (scannedText.includes('/smart-assets/asset/')) {
        const parts = scannedText.split('/smart-assets/asset/');
        assetId = parts[parts.length - 1].replace(/\//g, '');
      } else if (scannedText.includes('/asset/')) {
        const parts = scannedText.split('/asset/');
        assetId = parts[parts.length - 1].replace(/\//g, '');
      } else {
        assetId = scannedText.trim();
      }
      if (assetId) navigate(`/smart-assets/asset/${assetId}`);
    } catch (err) {
      console.error("Scan redirect failed:", err);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      navigate(`/smart-assets/asset/${manualId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6 md:p-12 relative overflow-hidden flex flex-col items-center justify-center">
      <div className="w-full max-w-lg z-10">
        <button
          onClick={() => navigate('/smart-assets/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 mb-8 transition-all group font-bold text-sm uppercase tracking-widest cursor-pointer mr-auto"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Hub
        </button>

        <div className="bg-white border border-gray-200 p-8 md:p-10 rounded-3xl shadow-sm text-center">
          <div className="w-16 h-16 bg-orange-100 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Camera size={28} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Scan QR Code</h2>
          <p className="text-gray-500 text-sm font-medium mb-8">
            Position the hardware asset's QR sticker within the scanner window to retrieve identity specifications.
          </p>

          {/* Scanner Box */}
          <div className="relative aspect-square w-full max-w-sm mx-auto bg-gray-100 rounded-3xl overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center mb-8">
            {error ? (
              <div className="p-6 text-center space-y-3">
                <ShieldAlert size={36} className="text-amber-500 mx-auto" />
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{error}</p>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <video
                  ref={videoRef}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  muted
                  playsInline
                />
                {/* Orange scanning overlay guide */}
                <div className="absolute inset-8 border-2 border-orange-500 rounded-2xl pointer-events-none">
                  <div className="w-full h-0.5 bg-orange-500 animate-bounce absolute top-1/2" />
                </div>
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <div className="border-t border-gray-100 pt-8 text-left">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Keyboard size={12} className="text-orange-500" /> Manual Override Lookup
            </h4>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <div className="relative flex-grow">
                <Monitor className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-xs font-semibold"
                  placeholder="Enter Asset ID manually (e.g. 1)"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 cursor-pointer text-white px-5 rounded-xl transition-all flex items-center justify-center gap-1 font-black uppercase text-[10px] tracking-wider"
              >
                Lookup <ArrowRight size={12} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
