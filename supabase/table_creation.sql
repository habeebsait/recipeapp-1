-- Create recipes table
CREATE TABLE recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    ingredients TEXT[] NOT NULL,
    instructions TEXT[] NOT NULL,
    prep_time INTEGER NOT NULL DEFAULT 0,
    cook_time INTEGER NOT NULL DEFAULT 0,
    servings INTEGER NOT NULL DEFAULT 1,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'Easy',
    category VARCHAR(100) NOT NULL DEFAULT 'General',
    rating DECIMAL(2,1) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (if not already exists from Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_recipes table (junction table for users and recipes)
CREATE TABLE saved_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- Create recipe_reviews table
CREATE TABLE recipe_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(recipe_id, user_id)
);

-- Create categories table (optional - for better category management)
CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_rating ON recipes(rating);
CREATE INDEX idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_recipe_id ON saved_recipes(recipe_id);
CREATE INDEX idx_recipe_reviews_recipe_id ON recipe_reviews(recipe_id);
CREATE INDEX idx_recipe_reviews_user_id ON recipe_reviews(user_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policies for recipes (everyone can read, only authenticated users can create/update)
CREATE POLICY "Anyone can view recipes" ON recipes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert recipes" ON recipes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own recipes" ON recipes FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policies for saved_recipes (users can only access their own saved recipes)
CREATE POLICY "Users can view their own saved recipes" ON saved_recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can save recipes" ON saved_recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unsave their recipes" ON saved_recipes FOR DELETE USING (auth.uid() = user_id);

-- Policies for recipe_reviews (users can view all reviews but only modify their own)
CREATE POLICY "Anyone can view reviews" ON recipe_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON recipe_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON recipe_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON recipe_reviews FOR DELETE USING (auth.uid() = user_id);

-- Policies for users (users can view and update their own profile)
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipe_reviews_updated_at BEFORE UPDATE ON recipe_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
