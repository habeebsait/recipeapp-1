import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/recipe.dart';
import '../services/recipe_service.dart';

class SupabaseRecipeProvider with ChangeNotifier {
  final RecipeService _recipeService = RecipeService();

  List<Recipe> _allRecipes = [];
  List<Recipe> _savedRecipes = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String _selectedCategory = 'All';
  String? _error;

  List<Recipe> get allRecipes => _allRecipes;
  List<Recipe> get savedRecipes => _savedRecipes;
  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;
  String? get error => _error;

  List<Recipe> get filteredRecipes {
    List<Recipe> filtered = _allRecipes;

    // Filter by category
    if (_selectedCategory != 'All') {
      filtered = filtered
          .where((recipe) => recipe.category == _selectedCategory)
          .toList();
    }

    // Filter by search query
    if (_searchQuery.isNotEmpty) {
      filtered = filtered
          .where((recipe) =>
              recipe.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              recipe.description
                  .toLowerCase()
                  .contains(_searchQuery.toLowerCase()) ||
              recipe.ingredients.any((ingredient) => ingredient
                  .toLowerCase()
                  .contains(_searchQuery.toLowerCase())))
          .toList();
    }

    return filtered;
  }

  List<String> get categories {
    Set<String> categorySet = {'All'};
    categorySet.addAll(_allRecipes.map((recipe) => recipe.category));
    return categorySet.toList();
  }

  SupabaseRecipeProvider() {
    loadRecipes();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setSelectedCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  Future<bool> isRecipeSaved(String recipeId) async {
    try {
      return await _recipeService.isRecipeSaved(recipeId);
    } catch (e) {
      // Fallback to local check if Supabase fails
      return _savedRecipes.any((recipe) => recipe.id == recipeId);
    }
  }

  Future<void> toggleSavedRecipe(Recipe recipe) async {
    try {
      final isSaved = await isRecipeSaved(recipe.id);

      if (isSaved) {
        await _recipeService.unsaveRecipe(recipe.id);
        _savedRecipes.removeWhere((r) => r.id == recipe.id);
      } else {
        await _recipeService.saveRecipe(recipe.id);
        _savedRecipes.add(recipe);
      }

      await _saveSavedRecipesLocally();
      notifyListeners();
    } catch (e) {
      // Fallback to local storage if Supabase fails
      if (_savedRecipes.any((r) => r.id == recipe.id)) {
        _savedRecipes.removeWhere((r) => r.id == recipe.id);
      } else {
        _savedRecipes.add(recipe);
      }
      await _saveSavedRecipesLocally();
      notifyListeners();
    }
  }

  Future<void> loadRecipes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Try to load from Supabase first
      _allRecipes = await _recipeService.fetchRecipes();
      await _loadSavedRecipes();
    } catch (e) {
      _error = 'Failed to load recipes from server';
      // Fallback to local dummy data if Supabase fails
      _loadLocalRecipes();
      await _loadSavedRecipesLocally();
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _loadSavedRecipes() async {
    try {
      _savedRecipes = await _recipeService.getSavedRecipes();
    } catch (e) {
      // Fallback to local storage
      await _loadSavedRecipesLocally();
    }
  }

  Future<void> _saveSavedRecipesLocally() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedRecipesJson =
          _savedRecipes.map((recipe) => recipe.toJson()).toList();
      await prefs.setString('saved_recipes', jsonEncode(savedRecipesJson));
    } catch (e) {
      debugPrint('Failed to save recipes locally: $e');
    }
  }

  Future<void> _loadSavedRecipesLocally() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedRecipesString = prefs.getString('saved_recipes');
      if (savedRecipesString != null) {
        final List<dynamic> savedRecipesJson = jsonDecode(savedRecipesString);
        _savedRecipes =
            savedRecipesJson.map((json) => Recipe.fromJson(json)).toList();
      }
    } catch (e) {
      debugPrint('Failed to load saved recipes locally: $e');
    }
  }

  void _loadLocalRecipes() {
    // Same dummy data as before, used as fallback
    _allRecipes = [
      Recipe(
        id: '1',
        name: 'Classic Spaghetti Carbonara',
        description:
            'A traditional Italian pasta dish with eggs, cheese, and bacon.',
        imageUrl:
            'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500',
        ingredients: [
          '400g spaghetti',
          '200g guanciale or pancetta',
          '4 large eggs',
          '100g Pecorino Romano cheese',
          'Black pepper',
          'Salt'
        ],
        instructions: [
          'Boil water and cook spaghetti until al dente',
          'Cut guanciale into small pieces and cook until crispy',
          'Beat eggs with grated cheese and black pepper',
          'Drain pasta and mix with guanciale',
          'Remove from heat and add egg mixture, stirring quickly',
          'Serve immediately with extra cheese'
        ],
        prepTime: 15,
        cookTime: 20,
        servings: 4,
        difficulty: 'Medium',
        category: 'Dinner',
        rating: 4.5,
        reviewCount: 128,
      ),
      // Add other dummy recipes here...
    ];
  }

  Future<void> refreshRecipes() async {
    await loadRecipes();
  }

  Future<void> addRecipeReview({
    required String recipeId,
    required int rating,
    String? comment,
  }) async {
    try {
      await _recipeService.addRecipeReview(
        recipeId: recipeId,
        rating: rating,
        comment: comment,
      );
      // Refresh the specific recipe to get updated rating
      await refreshRecipes();
    } catch (e) {
      throw Exception('Failed to add review: $e');
    }
  }

  Future<List<Map<String, dynamic>>> getRecipeReviews(String recipeId) async {
    try {
      return await _recipeService.getRecipeReviews(recipeId);
    } catch (e) {
      throw Exception('Failed to get reviews: $e');
    }
  }

  Future<List<Recipe>> searchRecipes(String query) async {
    try {
      return await _recipeService.searchRecipes(query);
    } catch (e) {
      // Fallback to local search
      return _allRecipes
          .where((recipe) =>
              recipe.name.toLowerCase().contains(query.toLowerCase()) ||
              recipe.description.toLowerCase().contains(query.toLowerCase()))
          .toList();
    }
  }

  Future<List<Recipe>> getPopularRecipes() async {
    try {
      return await _recipeService.getPopularRecipes();
    } catch (e) {
      // Fallback to local sorting
      final sorted = List<Recipe>.from(_allRecipes);
      sorted.sort((a, b) => b.rating.compareTo(a.rating));
      return sorted.take(10).toList();
    }
  }

  Future<List<Recipe>> getRecentRecipes() async {
    try {
      return await _recipeService.getRecentRecipes();
    } catch (e) {
      // Fallback to returning all recipes
      return _allRecipes.take(10).toList();
    }
  }
}
