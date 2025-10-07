class SupabaseConfig {
  // Replace these with your actual Supabase project URL and anon key
  static const String supabaseUrl = 'YOUR_SUPABASE_URL';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

  // Table names
  static const String recipesTable = 'recipes';
  static const String usersTable = 'users';
  static const String savedRecipesTable = 'saved_recipes';
  static const String recipeReviewsTable = 'recipe_reviews';
  static const String categoriesTable = 'categories';
}

// Example configuration for environment variables
// Create a .env file in your project root with:
/*
SUPABASE_URL=your_actual_supabase_url_here
SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
*/
