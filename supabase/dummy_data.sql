-- Insert categories first
INSERT INTO categories (name, description, icon) VALUES
('Breakfast', 'Morning meals and breakfast dishes', 'breakfast'),
('Lunch', 'Midday meals and light dishes', 'lunch'),
('Dinner', 'Evening meals and main courses', 'dinner'),
('Dessert', 'Sweet treats and desserts', 'cake'),
('Snacks', 'Quick bites and appetizers', 'snack'),
('Beverages', 'Drinks and beverages', 'local_bar'),
('Salads', 'Fresh salads and healthy bowls', 'eco'),
('Vegetarian', 'Plant-based dishes', 'eco'),
('Vegan', 'Completely plant-based meals', 'nature'),
('Gluten-Free', 'Gluten-free recipes', 'health_and_safety');

-- Insert dummy recipes
INSERT INTO recipes (name, description, image_url, ingredients, instructions, prep_time, cook_time, servings, difficulty, category, rating, review_count) VALUES
(
    'Classic Spaghetti Carbonara',
    'A traditional Italian pasta dish with eggs, cheese, and crispy pancetta. Creamy, rich, and absolutely delicious.',
    'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=500&h=300&fit=crop',
    ARRAY[
        '400g spaghetti pasta',
        '200g pancetta or guanciale, diced',
        '4 large eggs',
        '100g Pecorino Romano cheese, grated',
        '2 cloves garlic, minced',
        'Freshly ground black pepper',
        'Salt to taste',
        '2 tbsp olive oil'
    ],
    ARRAY[
        'Bring a large pot of salted water to boil and cook spaghetti until al dente',
        'In a large pan, heat olive oil and cook pancetta until crispy',
        'Add garlic to the pancetta and cook for 30 seconds',
        'In a bowl, whisk together eggs, cheese, and black pepper',
        'Drain pasta, reserving 1 cup of pasta water',
        'Remove pan from heat and add hot pasta to the pancetta',
        'Quickly add egg mixture, tossing constantly to create a creamy sauce',
        'Add pasta water if needed to achieve desired consistency',
        'Serve immediately with extra cheese and black pepper'
    ],
    15, 20, 4, 'Medium', 'Dinner', 4.5, 128
),
(
    'Chocolate Chip Cookies',
    'Soft, chewy, and loaded with chocolate chips. The perfect homemade cookie that everyone will love.',
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&h=300&fit=crop',
    ARRAY[
        '2¼ cups all-purpose flour',
        '1 tsp baking soda',
        '1 tsp salt',
        '1 cup butter, softened',
        '¾ cup granulated sugar',
        '¾ cup brown sugar, packed',
        '2 large eggs',
        '2 tsp vanilla extract',
        '2 cups chocolate chips'
    ],
    ARRAY[
        'Preheat oven to 375°F (190°C)',
        'In a bowl, whisk together flour, baking soda, and salt',
        'In a large bowl, cream butter and both sugars until light and fluffy',
        'Beat in eggs one at a time, then vanilla extract',
        'Gradually mix in the flour mixture until just combined',
        'Stir in chocolate chips',
        'Drop rounded tablespoons of dough onto ungreased baking sheets',
        'Bake for 9-11 minutes until golden brown around edges',
        'Cool on baking sheet for 5 minutes before transferring to wire rack'
    ],
    20, 12, 36, 'Easy', 'Dessert', 4.8, 256
),
(
    'Avocado Toast Supreme',
    'Elevate your breakfast with this loaded avocado toast featuring fresh tomatoes, eggs, and a sprinkle of everything seasoning.',
    'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=500&h=300&fit=crop',
    ARRAY[
        '2 slices whole grain bread',
        '1 large ripe avocado',
        '1 tbsp fresh lemon juice',
        '2 eggs',
        '1 small tomato, sliced',
        '2 tbsp everything bagel seasoning',
        'Salt and pepper to taste',
        '1 tbsp olive oil',
        'Red pepper flakes (optional)'
    ],
    ARRAY[
        'Toast bread slices until golden brown',
        'Cut avocado in half, remove pit, and mash with lemon juice, salt, and pepper',
        'Heat olive oil in a pan and fry eggs to your preference',
        'Spread mashed avocado evenly on toast',
        'Top with sliced tomatoes',
        'Place fried egg on top',
        'Sprinkle with everything bagel seasoning and red pepper flakes',
        'Serve immediately while warm'
    ],
    10, 5, 2, 'Easy', 'Breakfast', 4.2, 89
),
(
    'Grilled Chicken Caesar Salad',
    'A fresh and satisfying salad with perfectly grilled chicken, crisp romaine lettuce, and homemade Caesar dressing.',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=300&fit=crop',
    ARRAY[
        '2 chicken breasts',
        '1 large head romaine lettuce, chopped',
        '½ cup Caesar dressing',
        '¼ cup Parmesan cheese, grated',
        '1 cup croutons',
        '2 tbsp olive oil',
        '1 tsp garlic powder',
        '1 tsp Italian seasoning',
        'Salt and pepper to taste',
        '1 lemon, cut into wedges'
    ],
    ARRAY[
        'Season chicken breasts with olive oil, garlic powder, Italian seasoning, salt, and pepper',
        'Preheat grill or grill pan to medium-high heat',
        'Grill chicken for 6-7 minutes per side until internal temperature reaches 165°F',
        'Let chicken rest for 5 minutes, then slice into strips',
        'Wash and chop romaine lettuce',
        'In a large bowl, toss lettuce with Caesar dressing',
        'Top with grilled chicken slices',
        'Add croutons and Parmesan cheese',
        'Serve with lemon wedges'
    ],
    15, 15, 2, 'Easy', 'Lunch', 4.3, 67
),
(
    'Beef Tacos with Fresh Salsa',
    'Delicious seasoned ground beef tacos served with fresh salsa, avocado, and all your favorite toppings.',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=300&fit=crop',
    ARRAY[
        '1 lb ground beef',
        '8 taco shells or tortillas',
        '1 packet taco seasoning',
        '1 cup shredded lettuce',
        '1 cup diced tomatoes',
        '1 cup shredded Mexican cheese',
        '½ cup sour cream',
        '1 avocado, sliced',
        '¼ cup chopped cilantro',
        '1 lime, cut into wedges',
        '½ cup water'
    ],
    ARRAY[
        'Heat a large skillet over medium-high heat',
        'Add ground beef and cook until browned, breaking it up as it cooks',
        'Drain excess fat',
        'Add taco seasoning and water, stir to combine',
        'Simmer for 5 minutes until sauce thickens',
        'Warm taco shells according to package directions',
        'Fill each shell with seasoned beef',
        'Top with lettuce, tomatoes, cheese, sour cream, and avocado',
        'Garnish with cilantro and serve with lime wedges'
    ],
    10, 15, 4, 'Easy', 'Dinner', 4.6, 145
),
(
    'Vegetarian Buddha Bowl',
    'A nourishing bowl packed with quinoa, roasted vegetables, chickpeas, and a tahini dressing.',
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&h=300&fit=crop',
    ARRAY[
        '1 cup quinoa',
        '1 can chickpeas, drained and rinsed',
        '2 cups sweet potato, cubed',
        '2 cups broccoli florets',
        '1 cup shredded red cabbage',
        '1 avocado, sliced',
        '2 tbsp tahini',
        '2 tbsp lemon juice',
        '1 tbsp maple syrup',
        '2 tbsp olive oil',
        '1 tsp cumin',
        'Salt and pepper to taste',
        '2 tbsp pumpkin seeds'
    ],
    ARRAY[
        'Preheat oven to 400°F (200°C)',
        'Cook quinoa according to package instructions',
        'Toss sweet potato and broccoli with olive oil, salt, and pepper',
        'Roast vegetables for 25-30 minutes until tender',
        'Season chickpeas with cumin, salt, and pepper',
        'In a small bowl, whisk tahini, lemon juice, and maple syrup',
        'Divide quinoa among bowls',
        'Top with roasted vegetables, chickpeas, cabbage, and avocado',
        'Drizzle with tahini dressing and sprinkle with pumpkin seeds'
    ],
    20, 30, 3, 'Medium', 'Vegetarian', 4.4, 92
),
(
    'Pancakes with Berry Compote',
    'Fluffy buttermilk pancakes served with a homemade mixed berry compote and maple syrup.',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=500&h=300&fit=crop',
    ARRAY[
        '2 cups all-purpose flour',
        '2 tbsp sugar',
        '2 tsp baking powder',
        '1 tsp salt',
        '2 cups buttermilk',
        '2 large eggs',
        '¼ cup melted butter',
        '1 cup mixed berries',
        '3 tbsp sugar (for compote)',
        '1 tbsp lemon juice',
        'Butter for cooking',
        'Maple syrup for serving'
    ],
    ARRAY[
        'In a large bowl, whisk together flour, sugar, baking powder, and salt',
        'In another bowl, whisk buttermilk, eggs, and melted butter',
        'Pour wet ingredients into dry ingredients and stir until just combined',
        'For compote: cook berries, sugar, and lemon juice in a small pan for 5 minutes',
        'Heat a griddle or large pan over medium heat and add butter',
        'Pour ¼ cup batter for each pancake',
        'Cook until bubbles form on surface, then flip and cook until golden',
        'Serve hot with berry compote and maple syrup'
    ],
    15, 20, 4, 'Easy', 'Breakfast', 4.7, 178
),
(
    'Mediterranean Quinoa Salad',
    'A refreshing salad with quinoa, cucumbers, tomatoes, olives, feta cheese, and a lemon herb dressing.',
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&h=300&fit=crop',
    ARRAY[
        '1 cup quinoa',
        '1 cucumber, diced',
        '2 cups cherry tomatoes, halved',
        '½ cup kalamata olives, pitted',
        '½ cup feta cheese, crumbled',
        '¼ cup red onion, finely diced',
        '¼ cup fresh parsley, chopped',
        '3 tbsp olive oil',
        '2 tbsp lemon juice',
        '1 tsp dried oregano',
        '2 cloves garlic, minced',
        'Salt and pepper to taste'
    ],
    ARRAY[
        'Cook quinoa according to package instructions and let cool',
        'In a large bowl, combine cooled quinoa, cucumber, tomatoes, olives, and red onion',
        'Add crumbled feta cheese and parsley',
        'In a small bowl, whisk olive oil, lemon juice, oregano, garlic, salt, and pepper',
        'Pour dressing over salad and toss to combine',
        'Let marinate for 30 minutes before serving',
        'Serve chilled or at room temperature'
    ],
    15, 15, 4, 'Easy', 'Salads', 4.3, 134
),
(
    'Spicy Thai Basil Stir Fry',
    'A quick and flavorful stir fry with ground pork, fresh basil, chilies, and jasmine rice.',
    'https://images.unsplash.com/photo-1559314809-0f31657d96de?w=500&h=300&fit=crop',
    ARRAY[
        '1 lb ground pork',
        '3 cloves garlic, minced',
        '2-3 Thai chilies, minced',
        '1 cup fresh Thai basil leaves',
        '2 tbsp vegetable oil',
        '2 tbsp fish sauce',
        '1 tbsp soy sauce',
        '1 tbsp oyster sauce',
        '1 tsp sugar',
        '1 red bell pepper, sliced',
        '1 onion, sliced',
        '4 cups cooked jasmine rice',
        '4 fried eggs (optional)'
    ],
    ARRAY[
        'Heat oil in a large wok or skillet over high heat',
        'Add garlic and chilies, stir-fry for 30 seconds',
        'Add ground pork and cook until browned and cooked through',
        'Add bell pepper and onion, stir-fry for 2-3 minutes',
        'In a small bowl, mix fish sauce, soy sauce, oyster sauce, and sugar',
        'Pour sauce over pork and vegetables',
        'Add fresh basil leaves and stir until wilted',
        'Serve over jasmine rice with fried eggs if desired'
    ],
    10, 12, 4, 'Medium', 'Dinner', 4.5, 203
),
(
    'Smoothie Bowl Paradise',
    'A thick, creamy acai smoothie bowl topped with fresh fruits, nuts, and seeds for a healthy breakfast.',
    'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=500&h=300&fit=crop',
    ARRAY[
        '1 frozen acai packet',
        '1 frozen banana',
        '½ cup frozen mixed berries',
        '¼ cup almond milk',
        '1 tbsp honey',
        '½ banana, sliced',
        '¼ cup granola',
        '2 tbsp coconut flakes',
        '1 tbsp chia seeds',
        '¼ cup fresh berries',
        '2 tbsp almond butter',
        '1 kiwi, sliced'
    ],
    ARRAY[
        'Blend frozen acai, frozen banana, frozen berries, almond milk, and honey until thick',
        'Pour smoothie into a bowl',
        'Arrange toppings in sections: sliced banana, granola, coconut flakes',
        'Add chia seeds, fresh berries, and kiwi slices',
        'Drizzle with almond butter',
        'Serve immediately with a spoon'
    ],
    10, 0, 1, 'Easy', 'Breakfast', 4.6, 87
);

-- Insert some sample users (you would typically handle this through Supabase Auth)
-- This is just for reference - actual users would be created through authentication
/*
INSERT INTO users (id, email, full_name) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'john.doe@example.com', 'John Doe'),
('b1ffcd99-9c0b-4ef8-bb6d-6bb9bd380a22', 'jane.smith@example.com', 'Jane Smith'),
('c2ffcd99-9c0b-4ef8-bb6d-6bb9bd380a33', 'chef.maria@example.com', 'Chef Maria');
*/

-- Function to update recipe ratings based on reviews
CREATE OR REPLACE FUNCTION update_recipe_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE recipes 
    SET 
        rating = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM recipe_reviews 
            WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
        ),
        review_count = (
            SELECT COUNT(*) 
            FROM recipe_reviews 
            WHERE recipe_id = COALESCE(NEW.recipe_id, OLD.recipe_id)
        )
    WHERE id = COALESCE(NEW.recipe_id, OLD.recipe_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update recipe ratings when reviews are added/updated/deleted
CREATE TRIGGER update_recipe_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON recipe_reviews
    FOR EACH ROW EXECUTE FUNCTION update_recipe_rating();
