'use client';

import React, { useState } from 'react';
import { Copy, Download, Printer, Check, Share2 } from 'lucide-react';

interface QRGeneratorProps {
  value: string;
  gymName: string;
  gymSlug: string;
}

export default function QRGenerator({ value, gymName, gymSlug }: QRGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=000000&bgcolor=ffffff&data=${encodeURIComponent(value)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${gymSlug}-membership-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download QR code, opening in new tab: ', err);
      window.open(qrUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code - ${gymName}</title>
          <style>
            body {
              font-family: 'Space Grotesk', system-ui, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 90vh;
              margin: 0;
              text-align: center;
              background-color: #f4f2ed;
              color: #000000;
            }
            .container {
              border: 4px solid #000000;
              padding: 40px;
              background: #ffffff;
              box-shadow: 10px 10px 0px 0px #000000;
              border-radius: 16px;
              max-width: 450px;
            }
            h1 {
              font-size: 36px;
              margin-bottom: 8px;
              font-weight: 800;
              text-transform: uppercase;
            }
            p.sub {
              font-size: 20px;
              font-weight: 600;
              color: #000000;
              margin-bottom: 30px;
              text-decoration: underline;
              text-decoration-color: #ff5e00;
              text-decoration-thickness: 3px;
            }
            img {
              width: 280px;
              height: 280px;
              border: 3px solid #000000;
              padding: 10px;
              border-radius: 8px;
              background: white;
            }
            .footer {
              margin-top: 30px;
              font-size: 14px;
              font-weight: 500;
              color: #4b5563;
            }
            .url {
              font-family: monospace;
              background: #f4f2ed;
              border: 2px solid #000000;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 14px;
              margin-top: 15px;
              font-weight: 700;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Scan to Join</h1>
            <p class="sub">${gymName}</p>
            <img src="${qrUrl}" alt="QR Code" />
            <div class="url">${value}</div>
            <p class="footer">Scan with any smartphone camera to choose a plan and register.</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="neo-card p-6 flex flex-col items-center">
      <div className="relative group bg-white border-3 border-black p-4 rounded-xl shadow-[3px_3px_0px_0px_#000000]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={qrUrl} 
          alt={`QR Code for ${gymName}`} 
          className="w-48 h-48 sm:w-56 sm:h-56 bg-white"
        />
      </div>

      <div className="w-full mt-6 space-y-4">
        {/* URL Display */}
        <div className="flex items-center gap-2 bg-[#f4f2ed] border-3 border-black rounded-lg p-2.5 shadow-[2px_2px_0px_0px_#000000]">
          <input 
            type="text" 
            readOnly 
            value={value} 
            className="flex-1 bg-transparent text-xs text-black font-mono font-bold focus:outline-none select-all overflow-ellipsis"
          />
          <button 
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-200 border-2 border-black rounded transition-colors text-black"
            title="Copy URL"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="neo-btn text-xs py-2.5 px-2 flex flex-col gap-1 items-center justify-center"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Saving...' : 'Download'}</span>
          </button>

          <button 
            onClick={handlePrint}
            className="neo-btn neo-btn-cyan text-xs py-2.5 px-2 flex flex-col gap-1 items-center justify-center"
          >
            <Printer className="w-4 h-4" />
            <span>Print QR</span>
          </button>

          <button 
            onClick={handleCopy}
            className="neo-btn neo-btn-yellow text-xs py-2.5 px-2 flex flex-col gap-1 items-center justify-center"
          >
            <Share2 className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Share QR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
