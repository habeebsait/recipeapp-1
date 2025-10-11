import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { generateRecipeUrl, getUsernameForUrl } from '../utils/urlUtils';
import './SavedRecipes.css';

function SavedRecipes() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unsaveLoading, setUnsaveLoading] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const navigate = useNavigate();

  const categories = ['All', 'Breakfast', 'Dinner', 'Dessert'];

  useEffect(() => {
    async function loadUserAndSavedRecipes() {
      try {
        // Check authentication
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
        if (!currentUser) {
          navigate('/');
          return;
        }

        // Load user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('username, full_name')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error loading profile:', profileError);
        } else {
          setProfile(userProfile);
        }

        // Fetch saved recipes (both from recipes and user_recipes tables)
        const { data: savedData, error: savedError } = await supabase
          .from('saved_recipes')
          .select(`
            id,
            recipe_id,
            user_recipe_id,
            saved_at,
            category
          `)
          .eq('user_id', currentUser.id)
          .order('saved_at', { ascending: false });

        if (savedError) throw savedError;

        if (!savedData || savedData.length === 0) {
          setSavedRecipes([]);
          return;
        }

        // Separate public recipes and user recipes
        const publicRecipeIds = savedData.filter(s => s.recipe_id).map(s => s.recipe_id);
        const userRecipeIds = savedData.filter(s => s.user_recipe_id).map(s => s.user_recipe_id);

        // Fetch public recipes
        let publicRecipes = [];
        if (publicRecipeIds.length > 0) {
          const { data: publicRecipesData, error: publicError } = await supabase
            .from('recipes')
            .select('id, title, category, image_url, ingredients, steps, created_at')
            .in('id', publicRecipeIds);
          
          if (!publicError) {
            publicRecipes = publicRecipesData || [];
          }
        }

        // Fetch user recipes with profiles
        let userRecipes = [];
        if (userRecipeIds.length > 0) {
          const { data: userRecipesData, error: userError } = await supabase
            .from('user_recipes')
            .select(`
              id,
              title,
              category,
              image_url,
              ingredients,
              steps,
              created_at,
              user_id,
              profiles (
                username,
                full_name
              )
            `)
            .in('id', userRecipeIds);
          
          if (!userError) {
            userRecipes = userRecipesData || [];
          }
        }

        // Create lookup maps
        const publicRecipeMap = new Map(publicRecipes.map(r => [r.id, r]));
        const userRecipeMap = new Map(userRecipes.map(r => [r.id, r]));

        // Combine all saved recipes with their data
        const combinedSavedRecipes = savedData.map(saved => {
          let recipeData = null;
          let source = null;

          if (saved.user_recipe_id) {
            recipeData = userRecipeMap.get(saved.user_recipe_id);
            source = 'user_recipes';
          } else if (saved.recipe_id) {
            recipeData = publicRecipeMap.get(saved.recipe_id);
            source = 'recipes';
          }

          return {
            id: saved.id,
            recipe_id: saved.recipe_id,
            user_recipe_id: saved.user_recipe_id,
            saved_at: saved.saved_at,
            source: source,
            recipe: recipeData
          };
        }).filter(item => item.recipe); // Filter out deleted recipes

        setSavedRecipes(combinedSavedRecipes);
        
      } catch (err) {
        console.error('Error loading saved recipes:', err);
        setError(`Failed to load saved recipes: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndSavedRecipes();
  }, [navigate]);

  const handleUnsaveRecipe = async (savedItemId, recipeTitle) => {
    if (!window.confirm(`Remove "${recipeTitle}" from your saved recipes?`)) {
      return;
    }

    try {
      setUnsaveLoading(savedItemId);
      
      const { error: deleteError } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', savedItemId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state to remove the unsaved recipe
      setSavedRecipes(prevRecipes => prevRecipes.filter(saved => saved.id !== savedItemId));
      
    } catch (err) {
      console.error('Error removing saved recipe:', err);
      alert(`Failed to remove recipe: ${err.message}`);
    } finally {
      setUnsaveLoading(null);
    }
  };

  const handleViewRecipe = (recipe, isUserRecipe) => {
    if (isUserRecipe) {
      // Navigate to user recipe detail page
      const recipeOwnerUsername = getUsernameForUrl(
        { id: recipe.user_id },
        recipe.profiles
      );
      navigate(generateRecipeUrl(recipeOwnerUsername, recipe));
    } else {
      // Navigate to public recipe detail page (you may need to implement this route)
      // For now, we'll use the same navigation
      navigate(`/recipes/${recipe.id}`);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="saved-recipes-page">
          <div className="saved-recipes-container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading your saved recipes...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="saved-recipes-page">
          <div className="saved-recipes-container">
            <div className="empty-state">
              <h2>Please Sign In</h2>
              <p>You need to be signed in to view your saved recipes.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Filter recipes by category
  const filteredRecipes = selectedCategory === 'All' 
    ? savedRecipes 
    : savedRecipes.filter(savedItem => 
        savedItem.recipe?.category?.toLowerCase() === selectedCategory.toLowerCase()
      );

  return (
    <>
      <Navigation />
      <div className="saved-recipes-page">
        <div className="saved-recipes-container">
          <div className="page-header">
            <div className="header-content">
              <h1 className="page-title">Saved Recipes</h1>
              <p className="page-subtitle">Your personal collection of culinary inspiration.</p>
            </div>
          </div>

          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {savedRecipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍳</div>
              <h3>No saved recipes yet</h3>
              <p>Save recipes you love to find them easily later!</p>
              <button 
                className="browse-btn"
                onClick={() => navigate('/')}
              >
                Browse Recipes
              </button>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No {selectedCategory.toLowerCase()} recipes saved</h3>
              <p>Try selecting a different category or save more recipes!</p>
            </div>
          ) : (
            <div className="recipes-grid">
              {filteredRecipes.map((savedItem) => {
                const recipe = savedItem.recipe;
                const isUserRecipe = savedItem.source === 'user_recipes';
                
                return (
                  <div key={savedItem.id} className="recipe-card" onClick={() => handleViewRecipe(recipe, isUserRecipe)}>
                    <div className="recipe-image-container">
                      <div className="recipe-image">
                        {recipe.image_url ? (
                          <img 
                            src={recipe.image_url} 
                            alt={recipe.title}
                            onError={(e) => {
                              e.target.src = '/api/placeholder/300/200';
                            }}
                          />
                        ) : (
                          <div className="placeholder-image">
                            <span>🍳</span>
                          </div>
                        )}
                      </div>
                      <button 
                        className="bookmark-btn saved"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsaveRecipe(savedItem.id, recipe.title);
                        }}
                        disabled={unsaveLoading === savedItem.id}
                        title="Remove from saved"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                        </svg>
                      </button>
                    </div>
                    
                    <div className="recipe-info">
                      <h3 className="recipe-title">{recipe.title}</h3>
                      <div className="recipe-author">
                       
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default SavedRecipes;