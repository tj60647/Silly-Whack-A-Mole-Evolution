
import React from 'react';
import Mole from './Mole.tsx';

interface GameBoardProps {
  activeIndices: number[];
  hitIndices: number[];
  moleImageUrl: string;
  catchphrase: string;
  onWhack: (index: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ activeIndices, hitIndices, moleImageUrl, catchphrase, onWhack }) => {
  return (
    <div className="grid grid-cols-3 gap-4 p-6 bg-emerald-700/50 rounded-2xl border-8 border-emerald-900 shadow-2xl max-w-xl mx-auto backdrop-blur-sm">
      {Array.from({ length: 9 }).map((_, i) => (
        <Mole
          key={i}
          id={i}
          isActive={activeIndices.includes(i)}
          isHit={hitIndices.includes(i)}
          imageUrl={moleImageUrl}
          catchphrase={catchphrase}
          onWhack={onWhack}
        />
      ))}
    </div>
  );
};

export default GameBoard;
