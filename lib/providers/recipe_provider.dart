import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/recipe.dart';

class RecipeProvider with ChangeNotifier {
  List<Recipe> _allRecipes = [];
  List<Recipe> _savedRecipes = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String _selectedCategory = 'All';

  List<Recipe> get allRecipes => _allRecipes;
  List<Recipe> get savedRecipes => _savedRecipes;
  bool get isLoading => _isLoading;
  String get searchQuery => _searchQuery;
  String get selectedCategory => _selectedCategory;

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

  RecipeProvider() {
    _loadSampleRecipes();
    _loadSavedRecipes();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void setSelectedCategory(String category) {
    _selectedCategory = category;
    notifyListeners();
  }

  bool isRecipeSaved(String recipeId) {
    return _savedRecipes.any((recipe) => recipe.id == recipeId);
  }

  Future<void> toggleSavedRecipe(Recipe recipe) async {
    if (isRecipeSaved(recipe.id)) {
      _savedRecipes.removeWhere((r) => r.id == recipe.id);
    } else {
      _savedRecipes.add(recipe);
    }
    await _saveSavedRecipes();
    notifyListeners();
  }

  Future<void> _saveSavedRecipes() async {
    final prefs = await SharedPreferences.getInstance();
    final savedRecipesJson =
        _savedRecipes.map((recipe) => recipe.toJson()).toList();
    await prefs.setString('saved_recipes', jsonEncode(savedRecipesJson));
  }

  Future<void> _loadSavedRecipes() async {
    final prefs = await SharedPreferences.getInstance();
    final savedRecipesString = prefs.getString('saved_recipes');
    if (savedRecipesString != null) {
      final List<dynamic> savedRecipesJson = jsonDecode(savedRecipesString);
      _savedRecipes =
          savedRecipesJson.map((json) => Recipe.fromJson(json)).toList();
      notifyListeners();
    }
  }

  void _loadSampleRecipes() {
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
      Recipe(
        id: '2',
        name: 'Chocolate Chip Cookies',
        description: 'Soft and chewy homemade chocolate chip cookies.',
        imageUrl:
            'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500',
        ingredients: [
          '2¼ cups all-purpose flour',
          '1 tsp baking soda',
          '1 tsp salt',
          '1 cup butter, softened',
          '¾ cup granulated sugar',
          '¾ cup brown sugar',
          '2 large eggs',
          '2 tsp vanilla extract',
          '2 cups chocolate chips'
        ],
        instructions: [
          'Preheat oven to 375°F (190°C)',
          'Mix flour, baking soda, and salt in a bowl',
          'Cream butter and sugars until fluffy',
          'Beat in eggs and vanilla',
          'Gradually add flour mixture',
          'Stir in chocolate chips',
          'Drop spoonfuls on baking sheet',
          'Bake for 9-11 minutes until golden brown'
        ],
        prepTime: 20,
        cookTime: 12,
        servings: 36,
        difficulty: 'Easy',
        category: 'Dessert',
        rating: 4.8,
        reviewCount: 256,
      ),
      Recipe(
        id: '3',
        name: 'Avocado Toast',
        description:
            'Healthy and delicious avocado toast with various toppings.',
        imageUrl:
            'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500',
        ingredients: [
          '2 slices whole grain bread',
          '1 ripe avocado',
          '1 tbsp lemon juice',
          'Salt and pepper',
          'Optional: tomato, egg, seeds'
        ],
        instructions: [
          'Toast bread until golden brown',
          'Mash avocado with lemon juice, salt, and pepper',
          'Spread avocado mixture on toast',
          'Add optional toppings as desired',
          'Serve immediately'
        ],
        prepTime: 10,
        cookTime: 5,
        servings: 2,
        difficulty: 'Easy',
        category: 'Breakfast',
        rating: 4.2,
        reviewCount: 89,
      ),
      Recipe(
        id: '4',
        name: 'Grilled Chicken Salad',
        description:
            'Fresh and healthy grilled chicken salad with mixed greens.',
        imageUrl:
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
        ingredients: [
          '2 chicken breasts',
          '6 cups mixed greens',
          '1 cucumber, sliced',
          '1 cup cherry tomatoes',
          '½ red onion, sliced',
          '¼ cup olive oil',
          '2 tbsp balsamic vinegar',
          'Salt and pepper'
        ],
        instructions: [
          'Season chicken with salt and pepper',
          'Grill chicken for 6-7 minutes per side',
          'Let chicken rest, then slice',
          'Combine greens, cucumber, tomatoes, and onion',
          'Whisk olive oil and balsamic vinegar',
          'Top salad with chicken and dressing'
        ],
        prepTime: 15,
        cookTime: 15,
        servings: 2,
        difficulty: 'Easy',
        category: 'Lunch',
        rating: 4.3,
        reviewCount: 67,
      ),
      Recipe(
        id: '5',
        name: 'Beef Tacos',
        description:
            'Delicious seasoned ground beef tacos with fresh toppings.',
        imageUrl:
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500',
        ingredients: [
          '1 lb ground beef',
          '8 taco shells',
          '1 packet taco seasoning',
          '1 cup shredded lettuce',
          '1 cup diced tomatoes',
          '1 cup shredded cheese',
          '½ cup sour cream',
          '¼ cup chopped cilantro'
        ],
        instructions: [
          'Brown ground beef in a skillet',
          'Add taco seasoning and water as directed',
          'Simmer for 5 minutes',
          'Warm taco shells according to package',
          'Fill shells with beef',
          'Top with lettuce, tomatoes, cheese, sour cream, and cilantro'
        ],
        prepTime: 10,
        cookTime: 15,
        servings: 4,
        difficulty: 'Easy',
        category: 'Dinner',
        rating: 4.6,
        reviewCount: 145,
      ),
    ];
    notifyListeners();
  }

  Future<void> refreshRecipes() async {
    _isLoading = true;
    notifyListeners();

    // Simulate API call delay
    await Future.delayed(const Duration(seconds: 1));

    // In a real app, you would fetch from an API or database here
    _loadSampleRecipes();

    _isLoading = false;
    notifyListeners();
  }
}
