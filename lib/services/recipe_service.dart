import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/recipe.dart';
import '../config/supabase_config.dart';

class RecipeService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // Fetch all recipes
  Future<List<Recipe>> fetchRecipes({
    String? category,
    String? searchQuery,
    int? limit,
    int? offset,
  }) async {
    try {
      var query = _supabase.from(SupabaseConfig.recipesTable).select('*');

      // Apply filters
      if (category != null && category != 'All') {
        query = query.eq('category', category);
      }

      if (searchQuery != null && searchQuery.isNotEmpty) {
        query = query.or('name.ilike.%$searchQuery%,'
            'description.ilike.%$searchQuery%,'
            'ingredients.cs.{$searchQuery}');
      }

      // Order by rating and creation date
      var orderedQuery = query
          .order('rating', ascending: false)
          .order('created_at', ascending: false);

      // Apply pagination
      if (limit != null) {
        orderedQuery = orderedQuery.limit(limit);
      }

      if (offset != null) {
        orderedQuery = orderedQuery.range(offset, offset + (limit ?? 10) - 1);
      }

      final response = await orderedQuery;

      return response.map<Recipe>((json) => Recipe.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch recipes: $e');
    }
  }

  // Fetch a single recipe by ID
  Future<Recipe?> fetchRecipeById(String id) async {
    try {
      final response = await _supabase
          .from(SupabaseConfig.recipesTable)
          .select('*')
          .eq('id', id)
          .single();

      return Recipe.fromJson(response);
    } catch (e) {
      throw Exception('Failed to fetch recipe: $e');
    }
  }

  // Fetch categories
  Future<List<String>> fetchCategories() async {
    try {
      final response = await _supabase
          .from(SupabaseConfig.recipesTable)
          .select('category')
          .order('category');

      final categories = <String>{'All'};
      for (final row in response) {
        if (row['category'] != null) {
          categories.add(row['category'] as String);
        }
      }

      return categories.toList();
    } catch (e) {
      throw Exception('Failed to fetch categories: $e');
    }
  }

  // Create a new recipe
  Future<Recipe> createRecipe(Recipe recipe) async {
    try {
      final response = await _supabase
          .from(SupabaseConfig.recipesTable)
          .insert(recipe.toJson())
          .select()
          .single();

      return Recipe.fromJson(response);
    } catch (e) {
      throw Exception('Failed to create recipe: $e');
    }
  }

  // Update a recipe
  Future<Recipe> updateRecipe(Recipe recipe) async {
    try {
      final response = await _supabase
          .from(SupabaseConfig.recipesTable)
          .update(recipe.toJson())
          .eq('id', recipe.id)
          .select()
          .single();

      return Recipe.fromJson(response);
    } catch (e) {
      throw Exception('Failed to update recipe: $e');
    }
  }

  // Delete a recipe
  Future<void> deleteRecipe(String id) async {
    try {
      await _supabase.from(SupabaseConfig.recipesTable).delete().eq('id', id);
    } catch (e) {
      throw Exception('Failed to delete recipe: $e');
    }
  }

  // Save a recipe for the current user
  Future<void> saveRecipe(String recipeId) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _supabase.from(SupabaseConfig.savedRecipesTable).insert({
        'user_id': user.id,
        'recipe_id': recipeId,
      });
    } catch (e) {
      throw Exception('Failed to save recipe: $e');
    }
  }

  // Unsave a recipe for the current user
  Future<void> unsaveRecipe(String recipeId) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _supabase
          .from(SupabaseConfig.savedRecipesTable)
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);
    } catch (e) {
      throw Exception('Failed to unsave recipe: $e');
    }
  }

  // Get saved recipes for the current user
  Future<List<Recipe>> getSavedRecipes() async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final response = await _supabase
          .from(SupabaseConfig.savedRecipesTable)
          .select('recipes(*)')
          .eq('user_id', user.id);

      return response
          .map<Recipe>((item) => Recipe.fromJson(item['recipes']))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch saved recipes: $e');
    }
  }

  // Check if a recipe is saved by the current user
  Future<bool> isRecipeSaved(String recipeId) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) return false;

      final response = await _supabase
          .from(SupabaseConfig.savedRecipesTable)
          .select('id')
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);

      return response.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  // Add a review for a recipe
  Future<void> addRecipeReview({
    required String recipeId,
    required int rating,
    String? comment,
  }) async {
    try {
      final user = _supabase.auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      await _supabase.from(SupabaseConfig.recipeReviewsTable).upsert({
        'recipe_id': recipeId,
        'user_id': user.id,
        'rating': rating,
        'comment': comment,
      });
    } catch (e) {
      throw Exception('Failed to add review: $e');
    }
  }

  // Get reviews for a recipe
  Future<List<Map<String, dynamic>>> getRecipeReviews(String recipeId) async {
    try {
      final response = await _supabase
          .from(SupabaseConfig.recipeReviewsTable)
          .select('*, users(full_name)')
          .eq('recipe_id', recipeId)
          .order('created_at', ascending: false);

      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      throw Exception('Failed to fetch reviews: $e');
    }
  }

  // Search recipes
  Future<List<Recipe>> searchRecipes(String query) async {
    try {
      final response = await _supabase
          .from(SupabaseConfig.recipesTable)
          .select('*')
          .or('name.ilike.%$query%,'
              'description.ilike.%$query%,'
              'ingredients.cs.{$query}')
          .order('rating', ascending: false);

      return response.map<Recipe>((json) => Recipe.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to search recipes: $e');
    }
  }

  // Get popular recipes (highest rated)
  Future<List<Recipe>> getPopularRecipes({int limit = 10}) async {
    try {
      final response = await _supabase
          .from(SupabaseConfig.recipesTable)
          .select('*')
          .order('rating', ascending: false)
          .order('review_count', ascending: false)
          .limit(limit);

      return response.map<Recipe>((json) => Recipe.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch popular recipes: $e');
    }
  }

  // Get recent recipes
  Future<List<Recipe>> getRecentRecipes({int limit = 10}) async {
    try {
      final response = await _supabase
          .from(SupabaseConfig.recipesTable)
          .select('*')
          .order('created_at', ascending: false)
          .limit(limit);

      return response.map<Recipe>((json) => Recipe.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to fetch recent recipes: $e');
    }
  }
}
