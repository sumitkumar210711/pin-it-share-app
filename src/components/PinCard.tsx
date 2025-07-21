import React, { useState } from 'react';
import { Heart, Bookmark, Download, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

interface PinCardProps {
  pin: Pin;
  liked?: boolean;
  saved?: boolean;
  onLike?: (pinId: string, liked: boolean) => void;
  onSave?: (pinId: string, saved: boolean) => void;
  onDelete?: (pinId: string) => void;
}

const PinCard: React.FC<PinCardProps> = ({ 
  pin, 
  liked = false, 
  saved = false, 
  onLike, 
  onSave,
  onDelete 
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(liked);
  const [isSaved, setIsSaved] = useState(saved);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isOwner = user?.id === pin.user_id;

  const handleLike = async () => {
    if (!user) return;
    
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('pin_id', pin.id);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, pin_id: pin.id });
      }
      
      setIsLiked(!isLiked);
      onLike?.(pin.id, !isLiked);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      if (isSaved) {
        await supabase
          .from('saves')
          .delete()
          .eq('user_id', user.id)
          .eq('pin_id', pin.id);
      } else {
        await supabase
          .from('saves')
          .insert({ user_id: user.id, pin_id: pin.id });
      }
      
      setIsSaved(!isSaved);
      onSave?.(pin.id, !isSaved);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    
    try {
      await supabase
        .from('pins')
        .delete()
        .eq('id', pin.id);
      
      onDelete?.(pin.id);
      toast({
        title: "Pin deleted",
        description: "Your pin has been deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pin",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pin.image_url;
    link.download = `${pin.title || 'pin'}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-hover transition-all duration-300 animate-scale-in">
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <img
          src={pin.image_url}
          alt={pin.title}
          className={`w-full h-auto object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Loading placeholder */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
          </div>
        )}

        {/* Overlay with actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
          <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/90 hover:bg-background"
              onClick={handleSave}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-background/90 hover:bg-background"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                {isOwner && (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    Delete Pin
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              variant="secondary"
              className="bg-background/90 hover:bg-background"
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current text-primary' : ''}`} />
              Like
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sm text-foreground mb-2 line-clamp-2">
          {pin.title}
        </h3>
        
        {pin.description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {pin.description}
          </p>
        )}

        {/* Tags */}
        {pin.tags && pin.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {pin.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-muted rounded-full text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* User info */}
        <div className="flex items-center">
          <Avatar className="h-6 w-6 mr-2">
            <AvatarImage src={pin.profiles?.avatar_url} />
            <AvatarFallback className="text-xs">
              {pin.profiles?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate">
            {pin.profiles?.display_name || pin.profiles?.username || 'Unknown User'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PinCard;