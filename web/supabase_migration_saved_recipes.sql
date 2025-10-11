-- Migration: Add user_recipe_id column to saved_recipes table
-- This creates a direct foreign key relationship between saved_recipes and user_recipes

-- Step 1: Add the new column (nullable initially to allow existing data)
ALTER TABLE public.saved_recipes
ADD COLUMN user_recipe_id uuid;

-- Step 2: Add foreign key constraint
ALTER TABLE public.saved_recipes
ADD CONSTRAINT saved_recipes_user_recipe_id_fkey 
FOREIGN KEY (user_recipe_id) 
REFERENCES user_recipes (id) 
ON DELETE CASCADE;

-- Step 3: (Optional) If you want to migrate existing data where recipe_id actually points to user_recipes
-- Uncomment the following line if your recipe_id values are actually user_recipes IDs:
-- UPDATE public.saved_recipes SET user_recipe_id = recipe_id WHERE user_recipe_id IS NULL;

-- Step 4: (Optional) Create an index for better query performance
CREATE INDEX idx_saved_recipes_user_recipe_id ON public.saved_recipes(user_recipe_id);

-- Step 5: (Optional) If you want to make user_recipe_id NOT NULL after migration
-- Uncomment after ensuring all rows have user_recipe_id populated:
-- ALTER TABLE public.saved_recipes ALTER COLUMN user_recipe_id SET NOT NULL;

-- Verification query - Run this to check the new structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'saved_recipes'
ORDER BY ordinal_position;
