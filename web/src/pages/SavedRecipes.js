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
  
  const navigate = useNavigate();

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

        // Load saved recipes
        const { data: savedData, error: savedError } = await supabase
          .from('saved_recipes')
          .select(`
            id,
            created_at,
            user_recipes (
              id,
              title,
              category,
              ingredients,
              steps,
              image_url,
              created_at,
              user_id,
              profiles!user_recipes_user_id_fkey (
                username,
                full_name
              )
            )
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (savedError) {
          throw savedError;
        }

        // Filter out any null recipes (in case a recipe was deleted)
        const validSavedRecipes = (savedData || []).filter(item => item.user_recipes !== null);
        setSavedRecipes(validSavedRecipes);
        
      } catch (err) {
        console.error('Error loading saved recipes:', err);
        setError(`Failed to load saved recipes: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndSavedRecipes();
  }, [navigate]);

  const handleUnsaveRecipe = async (savedRecipeId, recipeTitle) => {
    if (!window.confirm(`Remove "${recipeTitle}" from your saved recipes?`)) {
      return;
    }

    try {
      setUnsaveLoading(savedRecipeId);
      
      const { error: deleteError } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('id', savedRecipeId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // Update local state to remove the unsaved recipe
      setSavedRecipes(prevRecipes => prevRecipes.filter(saved => saved.id !== savedRecipeId));
      
    } catch (err) {
      console.error('Error removing saved recipe:', err);
      alert(`Failed to remove recipe: ${err.message}`);
    } finally {
      setUnsaveLoading(null);
    }
  };

  const handleViewRecipe = (recipe) => {
    const recipeOwnerUsername = getUsernameForUrl(
      { id: recipe.user_id },
      recipe.profiles
    );
    navigate(generateRecipeUrl(recipeOwnerUsername, recipe));
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="saved-recipes-page">
          <div className="saved-recipes-container">
            <div className="loading-spinner">
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

  return (
    <>
      <Navigation />
      <div className="saved-recipes-page">
        <div className="saved-recipes-container">
          <div className="page-header">
            <div className="header-content">
              <h2 className="page-title">Saved Recipes</h2>
              <p className="page-subtitle">
                {savedRecipes.length === 0 
                  ? "You haven't saved any recipes yet" 
                  : `${savedRecipes.length} saved recipe${savedRecipes.length === 1 ? '' : 's'}`
                }
              </p>
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {savedRecipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">❤️</div>
              <h3>No saved recipes yet</h3>
              <p>Save recipes you love to find them easily later!</p>
              <button 
                className="browse-btn"
                onClick={() => navigate('/')}
              >
                Browse Recipes
              </button>
            </div>
          ) : (
            <div className="recipes-grid">
              {savedRecipes.map((savedItem) => {
                const recipe = savedItem.user_recipes;
                const recipeOwner = recipe.profiles;
                
                return (
                  <div key={savedItem.id} className="recipe-card">
                    {recipe.image_url && (
                      <div className="recipe-image">
                        <img 
                          src={recipe.image_url} 
                          alt={recipe.title}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="recipe-content">
                      <h3 className="recipe-title">{recipe.title}</h3>
                      <p className="recipe-category">{recipe.category}</p>
                      
                      <div className="recipe-author">
                        <span className="author-label">by</span>
                        <span className="author-name">
                          {recipeOwner?.full_name || recipeOwner?.username || 'Anonymous'}
                        </span>
                      </div>
                      
                      <div className="recipe-meta">
                        <div className="recipe-stats">
                          <span className="stat">
                            🥄 {recipe.ingredients?.length || 0} ingredients
                          </span>
                          <span className="stat">
                            📋 {recipe.steps?.length || 0} steps
                          </span>
                        </div>
                        <p className="recipe-date">
                          Saved {new Date(savedItem.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="recipe-actions">
                        <button 
                          className="action-btn view-btn"
                          onClick={() => handleViewRecipe(recipe)}
                        >
                          View Recipe
                        </button>
                        <button 
                          className="action-btn unsave-btn"
                          onClick={() => handleUnsaveRecipe(savedItem.id, recipe.title)}
                          disabled={unsaveLoading === savedItem.id}
                        >
                          {unsaveLoading === savedItem.id ? 'Removing...' : '💔 Unsave'}
                        </button>
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