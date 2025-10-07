class Recipe {
  final String id;
  final String name;
  final String description;
  final String imageUrl;
  final List<String> ingredients;
  final List<String> instructions;
  final int prepTime; // in minutes
  final int cookTime; // in minutes
  final int servings;
  final String difficulty; // Easy, Medium, Hard
  final String category; // Breakfast, Lunch, Dinner, Dessert, etc.
  final double rating;
  final int reviewCount;

  Recipe({
    required this.id,
    required this.name,
    required this.description,
    required this.imageUrl,
    required this.ingredients,
    required this.instructions,
    required this.prepTime,
    required this.cookTime,
    required this.servings,
    required this.difficulty,
    required this.category,
    this.rating = 0.0,
    this.reviewCount = 0,
  });

  int get totalTime => prepTime + cookTime;

  factory Recipe.fromJson(Map<String, dynamic> json) {
    return Recipe(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      imageUrl: json['image_url'] ?? '',
      ingredients: List<String>.from(json['ingredients'] ?? []),
      instructions: List<String>.from(json['instructions'] ?? []),
      prepTime: json['prep_time'] ?? 0,
      cookTime: json['cook_time'] ?? 0,
      servings: json['servings'] ?? 1,
      difficulty: json['difficulty'] ?? 'Easy',
      category: json['category'] ?? 'General',
      rating: (json['rating'] ?? 0.0).toDouble(),
      reviewCount: json['review_count'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'image_url': imageUrl,
      'ingredients': ingredients,
      'instructions': instructions,
      'prep_time': prepTime,
      'cook_time': cookTime,
      'servings': servings,
      'difficulty': difficulty,
      'category': category,
      'rating': rating,
      'review_count': reviewCount,
    };
  }

  Recipe copyWith({
    String? id,
    String? name,
    String? description,
    String? imageUrl,
    List<String>? ingredients,
    List<String>? instructions,
    int? prepTime,
    int? cookTime,
    int? servings,
    String? difficulty,
    String? category,
    double? rating,
    int? reviewCount,
  }) {
    return Recipe(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      ingredients: ingredients ?? this.ingredients,
      instructions: instructions ?? this.instructions,
      prepTime: prepTime ?? this.prepTime,
      cookTime: cookTime ?? this.cookTime,
      servings: servings ?? this.servings,
      difficulty: difficulty ?? this.difficulty,
      category: category ?? this.category,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
    );
  }
}
