import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/recipe_provider.dart';
import '../widgets/recipe_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Recipe Book',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.orange,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Consumer<RecipeProvider>(
        builder: (context, recipeProvider, child) {
          final filteredRecipes = recipeProvider.filteredRecipes;

          return Column(
            children: [
              // Search and Filter Section
              Container(
                color: Colors.orange,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: TextField(
                        controller: _searchController,
                        decoration: InputDecoration(
                          hintText: 'Search recipes...',
                          prefixIcon: const Icon(Icons.search),
                          suffixIcon: _searchController.text.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear),
                                  onPressed: () {
                                    _searchController.clear();
                                    recipeProvider.setSearchQuery('');
                                  },
                                )
                              : null,
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(25),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        onChanged: (value) {
                          recipeProvider.setSearchQuery(value);
                        },
                      ),
                    ),

                    // Category Filter
                    Container(
                      height: 50,
                      margin: const EdgeInsets.only(bottom: 16),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: recipeProvider.categories.length,
                        itemBuilder: (context, index) {
                          final category = recipeProvider.categories[index];
                          final isSelected =
                              recipeProvider.selectedCategory == category;

                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: FilterChip(
                              label: Text(category),
                              selected: isSelected,
                              onSelected: (selected) {
                                recipeProvider.setSelectedCategory(category);
                              },
                              backgroundColor: Colors.white.withOpacity(0.2),
                              selectedColor: Colors.white,
                              labelStyle: TextStyle(
                                color:
                                    isSelected ? Colors.orange : Colors.white,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),

              // Recipes List
              Expanded(
                child: RefreshIndicator(
                  onRefresh: recipeProvider.refreshRecipes,
                  child: recipeProvider.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : filteredRecipes.isEmpty
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.restaurant_menu,
                                    size: 64,
                                    color: Colors.grey[400],
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    recipeProvider.searchQuery.isNotEmpty ||
                                            recipeProvider.selectedCategory !=
                                                'All'
                                        ? 'No recipes found'
                                        : 'No recipes available',
                                    style: TextStyle(
                                      fontSize: 18,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                  if (recipeProvider.searchQuery.isNotEmpty ||
                                      recipeProvider.selectedCategory != 'All')
                                    Padding(
                                      padding: const EdgeInsets.only(top: 8),
                                      child: TextButton(
                                        onPressed: () {
                                          _searchController.clear();
                                          recipeProvider.setSearchQuery('');
                                          recipeProvider
                                              .setSelectedCategory('All');
                                        },
                                        child: const Text('Clear filters'),
                                      ),
                                    ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              padding:
                                  const EdgeInsets.only(top: 16, bottom: 16),
                              itemCount: filteredRecipes.length,
                              itemBuilder: (context, index) {
                                final recipe = filteredRecipes[index];
                                return RecipeCard(recipe: recipe);
                              },
                            ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
