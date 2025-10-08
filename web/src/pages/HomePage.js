import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { generateRecipeUrl, generateMyRecipesUrl, generateCreateRecipeUrl, getUsernameForUrl } from '../utils/urlUtils';
import './HomePage.css';

function HomePage() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch recent public recipes from recipes table
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
        .limit(24);

      const { data, error } = await query;
      if (error) throw error;
      
      setRecipes(data || []);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipe) => {
    // For public recipes table, navigate to a general recipe view
    navigate(`/recipe/${recipe.id}`);
  };

  return (
    <>
      <Navigation />
      <div className="homepage">
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Discover & Share
              <span className="hero-highlight">Amazing Recipes</span>
            </h1>
            <p className="hero-subtitle">
              Join our community of food lovers and share your favorite recipes with the world
            </p>
            {user ? (
              <div className="hero-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    const username = getUsernameForUrl(user, null);
                    navigate(generateCreateRecipeUrl(username));
                  }}
                >
                  Create Recipe
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    const username = getUsernameForUrl(user, null);
                    navigate(generateMyRecipesUrl(username));
                  }}
                >
                  My Recipes
                </button>
              </div>
            ) : (
              <div className="hero-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => window.dispatchEvent(new CustomEvent('openAuth'))}
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="recipes-section">
          <div className="container">
            <h2 className="section-title">Featured Recipes</h2>
            
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading recipes...</p>
              </div>
            ) : recipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No recipes yet</h3>
                <p>Be the first to share a recipe with our community!</p>
                {user && (
                  <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/create-recipe')}
                  >
                    Create First Recipe
                  </button>
                )}
              </div>
            ) : (
              <div className="recipes-grid">
                {recipes.map(recipe => (
                  <div 
                    key={recipe.id} 
                    className="recipe-card"
                    onClick={() => handleRecipeClick(recipe)}
                  >
                    <div className="recipe-image-container">
                      {recipe.image_url ? (
                        <img 
                          src={recipe.image_url} 
                          alt={recipe.title}
                          className="recipe-image"
                          loading="lazy"
                        />
                      ) : (
                        <div className="recipe-image-placeholder">
                          <span>🍳</span>
                        </div>
                      )}
                      <div className="recipe-overlay">
                        <h3 className="recipe-title">{recipe.title}</h3>
                        {recipe.category && (
                          <span className="recipe-category">{recipe.category}</span>
                        )}
                      </div>
                    </div>
                    <div className="recipe-footer">
                      <span className="recipe-date">
                        {new Date(recipe.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;