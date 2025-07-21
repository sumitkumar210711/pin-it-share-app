-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pins table for image posts
CREATE TABLE public.pins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pin_id)
);

-- Create saves table
CREATE TABLE public.saves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_id UUID NOT NULL REFERENCES public.pins(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pin_id)
);

-- Create storage bucket for pin images
INSERT INTO storage.buckets (id, name, public) VALUES ('pin-images', 'pin-images', true);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saves ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for pins
CREATE POLICY "Pins are viewable by everyone" 
ON public.pins FOR SELECT USING (true);

CREATE POLICY "Users can create their own pins" 
ON public.pins FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pins" 
ON public.pins FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pins" 
ON public.pins FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for likes
CREATE POLICY "Likes are viewable by everyone" 
ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for saves
CREATE POLICY "Users can view their own saves" 
ON public.saves FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saves" 
ON public.saves FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saves" 
ON public.saves FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for pin images
CREATE POLICY "Pin images are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'pin-images');

CREATE POLICY "Authenticated users can upload pin images" 
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'pin-images' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own pin images" 
ON storage.objects FOR UPDATE USING (
  bucket_id = 'pin-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own pin images" 
ON storage.objects FOR DELETE USING (
  bucket_id = 'pin-images' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pins_updated_at
  BEFORE UPDATE ON public.pins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();