# Saved Recipes Implementation Guide

## Overview
This document explains how the saved recipes feature works with both `recipes` (public recipes) and `user_recipes` (personal recipes) tables.

## Database Schema

### saved_recipes Table
```
- id: uuid (primary key)
- user_id: uuid (references auth.users)
- recipe_id: uuid (references recipes table) - for public recipes
- user_recipe_id: uuid (references user_recipes table) - for personal recipes
- saved_at: timestamp
- notes: text
- category: text
```

## How It Works

### 1. **SavedRecipes.js** - View All Saved Recipes
This page displays ALL saved recipes from both sources:

**Data Fetching:**
- Fetches all `saved_recipes` entries for the current user
- Separates them into two groups based on which field is populated:
  - `recipe_id` → Public recipes from `recipes` table
  - `user_recipe_id` → Personal recipes from `user_recipes` table
- Fetches the actual recipe data from both tables
- Combines everything into a unified display

**Features:**
- Category filtering works across both recipe types
- Click to view recipe (routes to appropriate detail page)
- Unsave button removes from saved_recipes
- Shows author for user recipes, "Community Recipe" for public recipes

### 2. **RecipeDetail.js** - Personal Recipe Detail Page
Route: `/:username/my-recipes/:recipeSlug`

**Saving Logic:**
- Checks if recipe is saved using `user_recipe_id`
- Save button adds entry to `saved_recipes` with `user_recipe_id`
- Unsave removes the entry

### 3. **RecipeView.js** - Public Recipe Detail Page
Route: `/recipes/:id`

**Saving Logic:**
- Checks if recipe is saved using `recipe_id`
- Save button adds entry to `saved_recipes` with `recipe_id`
- Unsave removes the entry
- Only shows public recipes (`is_public = true`)

## Code Flow

### Saving a User Recipe (RecipeDetail.js)
```javascript
// Insert into saved_recipes
{
  user_id: currentUser.id,
  user_recipe_id: recipe.id,  // ← Personal recipe ID
  recipe_id: null,
  category: recipe.category
}
```

### Saving a Public Recipe (RecipeView.js)
```javascript
// Insert into saved_recipes
{
  user_id: currentUser.id,
  recipe_id: recipe.id,        // ← Public recipe ID
  user_recipe_id: null,
  category: recipe.category
}
```

### Loading Saved Recipes (SavedRecipes.js)
```javascript
// 1. Fetch all saved_recipes entries
const savedData = await supabase
  .from('saved_recipes')
  .select('id, recipe_id, user_recipe_id, saved_at, category')
  .eq('user_id', currentUser.id);

// 2. Separate public and personal recipe IDs
const publicRecipeIds = savedData.filter(s => s.recipe_id).map(s => s.recipe_id);
const userRecipeIds = savedData.filter(s => s.user_recipe_id).map(s => s.user_recipe_id);

// 3. Fetch from both tables
const publicRecipes = await supabase.from('recipes').select('*').in('id', publicRecipeIds);
const userRecipes = await supabase.from('user_recipes').select('*, profiles(*)').in('id', userRecipeIds);

// 4. Combine into unified structure
const combined = savedData.map(saved => ({
  id: saved.id,
  source: saved.user_recipe_id ? 'user_recipes' : 'recipes',
  recipe: saved.user_recipe_id 
    ? userRecipeMap.get(saved.user_recipe_id)
    : publicRecipeMap.get(saved.recipe_id)
}));
```

## Key Points

1. **Dual Foreign Keys**: The `saved_recipes` table has two foreign key columns, but only ONE is populated per row:
   - Personal recipes → `user_recipe_id` is set, `recipe_id` is null
   - Public recipes → `recipe_id` is set, `user_recipe_id` is null

2. **Navigation**:
   - Personal recipes navigate to: `/:username/my-recipes/:slug`
   - Public recipes navigate to: `/recipes/:id`

3. **Unsaving**: Uses the `saved_recipes.id` (primary key) to delete entries, not the recipe IDs

4. **Category Filtering**: Works seamlessly across both recipe types since both tables have a `category` field

## Migration
Run the SQL migration in `supabase_migration_saved_recipes.sql` to add the `user_recipe_id` column to your database.

## Files Modified
- `/src/pages/SavedRecipes.js` - Main saved recipes page
- `/src/pages/RecipeDetail.js` - Personal recipe detail with save functionality
- `/src/pages/RecipeView.js` - Public recipe detail with save functionality
- `/supabase_migration_saved_recipes.sql` - Database migration script
