import React, { useEffect, useState } from 'react';
import PinCard from './PinCard';

interface Pin {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  tags?: string[];
  user_id: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

interface MasonryGridProps {
  pins: Pin[];
  likedPins: Set<string>;
  savedPins: Set<string>;
  onLike?: (pinId: string, liked: boolean) => void;
  onSave?: (pinId: string, saved: boolean) => void;
  onDelete?: (pinId: string) => void;
}

const MasonryGrid: React.FC<MasonryGridProps> = ({ 
  pins, 
  likedPins, 
  savedPins, 
  onLike, 
  onSave,
  onDelete 
}) => {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(2);
      else if (width < 1024) setColumns(3);
      else if (width < 1280) setColumns(4);
      else setColumns(5);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute pins across columns for masonry layout
  const distributeColumns = () => {
    const cols: Pin[][] = Array.from({ length: columns }, () => []);
    
    pins.forEach((pin, index) => {
      const columnIndex = index % columns;
      cols[columnIndex].push(pin);
    });
    
    return cols;
  };

  const columnData = distributeColumns();

  return (
    <div className="grid gap-4 px-4 py-6" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {columnData.map((columnPins, columnIndex) => (
        <div key={columnIndex} className="flex flex-col gap-4">
          {columnPins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              liked={likedPins.has(pin.id)}
              saved={savedPins.has(pin.id)}
              onLike={onLike}
              onSave={onSave}
              onDelete={onDelete}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;