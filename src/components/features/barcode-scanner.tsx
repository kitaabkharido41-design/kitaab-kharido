'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { Loader2, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BarcodeScannerProps {
  onResult: (result: string) => void
  onCancel: () => void
}

export function BarcodeScanner({ onResult, onCancel }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    let isMounted = true
    const scannerId = "isbn-reader"

    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode(scannerId)
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 100 },
            formatsToSupport: [
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
            ]
          },
          (decodedText) => {
            if (isMounted) {
              // Stop scanning once we get a result to prevent multiple triggers
              if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                  onResult(decodedText)
                }).catch(() => {
                  onResult(decodedText)
                })
              } else {
                onResult(decodedText)
              }
            }
          },
          (errorMessage) => {
            // Ignore scan errors as they happen constantly until a barcode is found
          }
        )

        if (isMounted) setLoading(false)
      } catch (err: any) {
        if (isMounted) {
          console.error("Camera start error:", err)
          setError(
            err?.message || 
            "Could not access camera. Please check permissions or try again."
          )
          setLoading(false)
        }
      }
    }

    // Small delay to ensure the DOM element is ready before attaching
    const timer = setTimeout(() => {
      if (isMounted) startScanner()
    }, 100)

    return () => {
      isMounted = false
      clearTimeout(timer)
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [onResult])

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-4 bg-white/5 rounded-lg border border-white/10 animate-in fade-in zoom-in duration-200">
      <div className="flex justify-between items-center w-full">
        <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wider">Scan Barcode (ISBN)</h3>
        <Button variant="ghost" size="icon" onClick={onCancel} className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8">
          <X className="size-4" />
        </Button>
      </div>

      <div className="relative w-full max-w-[300px] aspect-[4/3] bg-black/50 rounded-lg overflow-hidden flex items-center justify-center border border-white/10 shadow-inner">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1628]/90 z-10">
            <Loader2 className="size-6 text-amber-400 animate-spin mb-3" />
            <p className="text-xs text-white/60 font-medium">Requesting camera access...</p>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a1628] z-10 p-4 text-center">
            <AlertCircle className="size-8 text-red-400 mb-3" />
            <p className="text-xs text-red-300 font-medium leading-relaxed">{error}</p>
            <Button onClick={onCancel} variant="outline" size="sm" className="mt-4 border-white/20 text-white hover:bg-white/10 text-xs h-8">
              Enter Manually
            </Button>
          </div>
        ) : (
          <div id="isbn-reader" className="w-full h-full [&_video]:object-cover" />
        )}
      </div>
      
      <p className="text-[11px] text-white/40 text-center px-4 leading-relaxed">
        Position the barcode on the back of the book inside the frame. The scanner will automatically detect it.
      </p>
    </div>
  )
}
