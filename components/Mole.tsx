
import React from 'react';

interface MoleProps {
  id: number;
  isActive: boolean;
  isHit: boolean;
  imageUrl: string;
  onWhack: (id: number) => void;
  catchphrase: string;
}

const Mole: React.FC<MoleProps> = ({ id, isActive, isHit, imageUrl, onWhack, catchphrase }) => {
  return (
    <div className="relative w-full aspect-square bg-slate-900 rounded-full border-4 border-slate-800 shadow-[inset_0_4px_12px_rgba(0,0,0,0.8)] flex items-center justify-center group overflow-hidden">
      {/* The Hole Depth */}
      <div className="absolute inset-2 bg-black/60 rounded-full blur-sm"></div>
      
      {/* The Character */}
      <div 
        onClick={() => isActive && !isHit && onWhack(id)}
        className={`
          absolute inset-0 flex flex-col items-center justify-end transition-all duration-200 transform cursor-pointer z-10
          ${isActive ? 'translate-y-2 scale-100 opacity-100' : 'translate-y-full scale-50 opacity-0 pointer-events-none'}
        `}
      >
        {isActive && !isHit && (
           <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-2 py-0.5 rounded text-[9px] font-bold shadow-md animate-bounce whitespace-nowrap z-20 border border-black">
            {catchphrase}
           </div>
        )}
        
        <img 
          src={imageUrl} 
          alt="Target" 
          className={`w-4/5 h-4/5 object-contain transition-transform ${isHit ? 'scale-0' : 'scale-100'}`}
          draggable={false}
        />
      </div>

      {/* Hit Effect Overlay */}
      {isHit && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none bg-white/20 animate-pulse rounded-full">
          <span className="text-yellow-400 font-arcade text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)] scale-125 transition-transform">
            BAM!
          </span>
        </div>
      )}
    </div>
  );
};

export default Mole;
