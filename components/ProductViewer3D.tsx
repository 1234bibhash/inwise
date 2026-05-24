'use client'

import { useState } from 'react'
import { Sparkles, RotateCw, RotateCcw, AlertCircle } from 'lucide-react'

interface ProductViewer3DProps {
  modelUrl: string
  productName: string
}

export default function ProductViewer3D({
  modelUrl,
  productName,
}: ProductViewer3DProps) {
  const [angle, setAngle] = useState(0)

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden bg-gradient-to-tr from-gray-50 to-gray-100 border border-gray-200 p-8 flex flex-col justify-between" style={{ minHeight: '400px' }}>
      {/* Premium Header Status */}
      <div className="flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Spatial Reality Ready</span>
        </div>
        <div className="text-[10px] font-bold text-gray-400">
          Model: GLB Standard
        </div>
      </div>

      {/* Product Image Mock Rotation View */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        <div 
          className="w-56 h-56 transition-transform duration-300 ease-out flex items-center justify-center drop-shadow-2xl"
          style={{ transform: `rotateY(${angle}deg)` }}
        >
          <div className="bg-white/80 p-8 rounded-[40px] border border-white shadow-xl flex items-center justify-center aspect-square w-full">
            <Sparkles className="h-16 w-16 text-blue-500 animate-pulse" />
          </div>
        </div>
        
        <p className="text-[11px] text-gray-500 font-bold tracking-tight mt-6 text-center">
          {productName} Interactive Preview
        </p>
      </div>

      {/* Control Actions Bar */}
      <div className="flex flex-col gap-4 border-t border-gray-200/50 pt-4 z-10">
        <div className="flex justify-between items-center">
          <button 
            type="button"
            onClick={() => setAngle(prev => prev - 45)}
            className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-600"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          
          <div className="flex-1 px-6">
            <input 
              type="range"
              min="0"
              max="360"
              value={angle}
              onChange={e => setAngle(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <button 
            type="button"
            onClick={() => setAngle(prev => prev + 45)}
            className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all text-gray-600"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5 justify-center text-[9px] font-bold text-gray-400">
          <AlertCircle className="h-3 w-3" />
          <span>Click and drag slider or use controls to adjust model angle</span>
        </div>
      </div>
    </div>
  )
}
