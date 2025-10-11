import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { generateRecipeUrl, generateMyRecipesUrl, generateCreateRecipeUrl, getUsernameForUrl } from '../utils/urlUtils';
import './HomePage.css';

function HomePage() {
  const [featuredRecipes, setFeaturedRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Helper: subtitle copy to match the design tone
  const getRecipeSubtitle = (recipe) => {
    const title = (recipe?.title || '').toLowerCase();
    if (title.includes('pasta')) return 'A rich and flavorful pasta dish.';
    if (title.includes('salad')) return 'A refreshing salad with seasonal berries.';
    if (title.includes('cake') || title.includes('chocolate')) return 'A decadent chocolate dessert.';
    if (title.includes('chili') || title.includes('vegan')) return 'Hearty and packed with flavor.';
    if (recipe?.category) return `A delicious ${recipe.category.toLowerCase()} recipe.`;
    return 'A delicious recipe to try.';
  };
  // Default category images and colors for display
  const categoryStyles = {
    'Quick & Easy': { image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop', color: '#4a5568' },
    'Healthy': { image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&h=200&fit=crop', color: '#38a169' },
    'Desserts': { image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=200&fit=crop', color: '#9f7aea' },
    'Vegetarian': { image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop', color: '#ed8936' },
    'Family': { image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop', color: '#3182ce' },
    'Holiday': { image: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=300&h=200&fit=crop', color: '#d69e2e' },
    'Breakfast': { image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=300&h=200&fit=crop', color: '#f6ad55' },
    'Lunch': { image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop', color: '#68d391' },
    'Dinner': { image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&h=200&fit=crop', color: '#63b3ed' },
    'Snacks': { image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&h=200&fit=crop', color: '#fbb6ce' }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchRecipes(), fetchCategories()]);
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch featured recipes - limit to 4 for the featured section
      let query = supabase
        .from('recipes')
        .select(`
          id,
          title,
          category,
          image_url,
          created_at,
          ingredients,
          steps,
          is_public
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(4);

      const { data, error } = await query;
      if (error) throw error;
      
      // If no recipes found, use sample data for demonstration
      const recipes = data || [];
      if (recipes.length === 0) {
        const sampleRecipes = [
          {
            id: 'sample-1',
            title: 'Creamy Tomato Pasta',
            category: 'Dinner',
            image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
            created_at: new Date().toISOString()
          },
          {
            id: 'sample-2',
            title: 'Summer Berry Salad',
            category: 'Healthy',
            image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
            created_at: new Date().toISOString()
          },
          {
            id: 'sample-3',
            title: 'Chocolate Lava Cake',
            category: 'Dessert',
            image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
            created_at: new Date().toISOString()
          },
          {
            id: 'sample-4',
            title: 'Spicy Vegan Chili',
            category: 'Vegetarian',
            image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
            created_at: new Date().toISOString()
          }
        ];
        setFeaturedRecipes(sampleRecipes);
      } else {
        setFeaturedRecipes(recipes);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      // Set sample data on error as well
      const sampleRecipes = [
        {
          id: 'sample-1',
          title: 'Creamy Tomato Pasta',
          category: 'Dinner',
          image_url: 'https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5?w=400&h=300&fit=crop',
          created_at: new Date().toISOString()
        },
        {
          id: 'sample-2',
          title: 'Summer Berry Salad',
          category: 'Healthy',
          image_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
          created_at: new Date().toISOString()
        },
        {
          id: 'sample-3',
          title: 'Chocolate Lava Cake',
          category: 'Dessert',
          image_url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop',
          created_at: new Date().toISOString()
        },
        {
          id: 'sample-4',
          title: 'Spicy Vegan Chili',
          category: 'Vegetarian',
          image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=300&fit=crop',
          created_at: new Date().toISOString()
        }
      ];
      setFeaturedRecipes(sampleRecipes);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;

      // Transform categories to include styling information
      const categoriesWithStyles = (data || []).map(category => {
        const style = categoryStyles[category.name] || {
          image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop',
          color: '#6b7280'
        };
        
        return {
          ...category,
          image: style.image,
          color: style.color
        };
      });

      setCategories(categoriesWithStyles);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set default categories on error
      const defaultCategories = [
        { id: 1, name: 'Quick & Easy', image: categoryStyles['Quick & Easy'].image, color: categoryStyles['Quick & Easy'].color },
        { id: 2, name: 'Healthy', image: categoryStyles['Healthy'].image, color: categoryStyles['Healthy'].color },
        { id: 3, name: 'Desserts', image: categoryStyles['Desserts'].image, color: categoryStyles['Desserts'].color },
        { id: 4, name: 'Vegetarian', image: categoryStyles['Vegetarian'].image, color: categoryStyles['Vegetarian'].color },
        { id: 5, name: 'Family', image: categoryStyles['Family'].image, color: categoryStyles['Family'].color },
        { id: 6, name: 'Holiday', image: categoryStyles['Holiday'].image, color: categoryStyles['Holiday'].color }
      ];
      setCategories(defaultCategories);
    }
  };

  const handleRecipeClick = (recipe) => {
    // For public recipes table, navigate to a general recipe view
    navigate(`/recipe/${recipe.id}`);
  };

  const handleCategoryClick = (category) => {
    // Navigate to explore page with category filter or implement category filtering
    navigate(`/explore?category=${category.id}&name=${encodeURIComponent(category.name)}`);
  };

  return (
    <>
      <Navigation />
      <div className="homepage">
        {/* Featured Recipes Section */}
        <div className="featured-section">
          <div className="container">
            <h2 className="section-title">Featured Recipes</h2>
            
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading recipes...</p>
              </div>
            ) : featuredRecipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No featured recipes yet</h3>
                <p>Be the first to share a recipe with our community!</p>
                {user && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const username = getUsernameForUrl(user, null);
                      navigate(generateCreateRecipeUrl(username));
                    }}
                  >
                    Create First Recipe
                  </button>
                )}
              </div>
            ) : (
              <div className="featured-grid">
                {featuredRecipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    className="featured-card"
                    onClick={() => handleRecipeClick(recipe)}
                  >
                    <div className="featured-image-wrap">
                      {recipe.image_url ? (
                        <img 
                          src={recipe.image_url} 
                          alt={recipe.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="placeholder-image">
                          <span>🍳</span>
                        </div>
                      )}
                    </div>
                    <h3 className="featured-card-title">{recipe.title}</h3>
                    <p className="featured-card-subtitle">{getRecipeSubtitle(recipe)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Explore Categories Section */}
        <div className="categories-section">
          <div className="container">
            <h2 className="section-title">Explore Categories</h2>
            <div className="categories-grid">
              {categories.map((category) => (
                <div 
                  key={category.id}
                  className="category-card"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="category-image">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      loading="lazy"
                    />
                  </div>
                  <div className="category-name-static">{category.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;