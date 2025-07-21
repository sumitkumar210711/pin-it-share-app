import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import MasonryGrid from '@/components/MasonryGrid';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

const Home = () => {
  const { user } = useAuth();
  const [pins, setPins] = useState<Pin[]>([]);
  const [filteredPins, setFilteredPins] = useState<Pin[]>([]);
  const [likedPins, setLikedPins] = useState<Set<string>>(new Set());
  const [savedPins, setSavedPins] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPins();
    if (user) {
      fetchUserInteractions();
    }
  }, [user]);

  useEffect(() => {
    // Filter pins based on search query
    if (!searchQuery) {
      setFilteredPins(pins);
    } else {
      const filtered = pins.filter(pin => 
        pin.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        pin.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pin.profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPins(filtered);
    }
  }, [pins, searchQuery]);

  const fetchPins = async () => {
    try {
      // First fetch pins
      const { data: pinsData, error: pinsError } = await supabase
        .from('pins')
        .select('*')
        .order('created_at', { ascending: false });

      if (pinsError) throw pinsError;

      // Then fetch profiles for each pin
      const pinsWithProfiles = await Promise.all(
        (pinsData || []).map(async (pin) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('user_id', pin.user_id)
            .maybeSingle();

          return {
            ...pin,
            profiles: profile
          };
        })
      );

      setPins(pinsWithProfiles);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load pins",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInteractions = async () => {
    if (!user) return;

    try {
      // Fetch liked pins
      const { data: likes } = await supabase
        .from('likes')
        .select('pin_id')
        .eq('user_id', user.id);

      if (likes) {
        setLikedPins(new Set(likes.map(like => like.pin_id)));
      }

      // Fetch saved pins
      const { data: saves } = await supabase
        .from('saves')
        .select('pin_id')
        .eq('user_id', user.id);

      if (saves) {
        setSavedPins(new Set(saves.map(save => save.pin_id)));
      }
    } catch (error) {
      console.error('Error fetching user interactions:', error);
    }
  };

  const handleLike = (pinId: string, liked: boolean) => {
    setLikedPins(prev => {
      const newSet = new Set(prev);
      if (liked) {
        newSet.add(pinId);
      } else {
        newSet.delete(pinId);
      }
      return newSet;
    });
  };

  const handleSave = (pinId: string, saved: boolean) => {
    setSavedPins(prev => {
      const newSet = new Set(prev);
      if (saved) {
        newSet.add(pinId);
      } else {
        newSet.delete(pinId);
      }
      return newSet;
    });
  };

  const handleDelete = (pinId: string) => {
    setPins(prev => prev.filter(pin => pin.id !== pinId));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar onSearch={handleSearch} searchQuery={searchQuery} />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={handleSearch} searchQuery={searchQuery} />
      
      <main className="max-w-7xl mx-auto">
        {filteredPins.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {searchQuery ? 'No pins found' : 'No pins yet'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Try adjusting your search terms' 
                : 'Be the first to share something beautiful!'
              }
            </p>
          </div>
        ) : (
          <MasonryGrid
            pins={filteredPins}
            likedPins={likedPins}
            savedPins={savedPins}
            onLike={handleLike}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
};

export default Home;