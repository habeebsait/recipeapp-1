import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { generateRecipeUrl, generateCreateRecipeUrl, getUsernameForUrl } from '../utils/urlUtils';
import './MyRecipes.css';

function MyRecipes() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  const navigate = useNavigate();
  const { username } = useParams();

  useEffect(() => {
    async function loadUserAndRecipes() {
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

        // Validate that the username in URL matches current user
        const expectedUsername = getUsernameForUrl(currentUser, userProfile);
        if (username !== expectedUsername) {
          navigate(`/${expectedUsername}/my-recipes`);
          return;
        }

        // Load user's recipes
        const { data: recipeData, error: recipeError } = await supabase
          .from('user_recipes')
          .select(`
            id,
            title,
            category,
            ingredients,
            steps,
            image_url,
            created_at,
            updated_at
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (recipeError) {
          throw recipeError;
        }

        setRecipes(recipeData || []);
        
      } catch (err) {
        console.error('Error loading recipes:', err);
        setError(`Failed to load recipes: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadUserAndRecipes();
  }, [navigate, username]);

  const handleDeleteRecipe = async (recipeId, recipeTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${recipeTitle}"?`)) {
      return;
    }

    try {
      setDeleteLoading(recipeId);
      
      const { error: deleteError } = await supabase
        .from('user_recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user.id); // Ensure user can only delete their own recipes

      if (deleteError) {
        throw deleteError;
      }

      // Update local state to remove the deleted recipe
      setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== recipeId));
      
    } catch (err) {
      console.error('Error deleting recipe:', err);
      alert(`Failed to delete recipe: ${err.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleViewRecipe = (recipe) => {
    const username = getUsernameForUrl(user, profile);
    navigate(generateRecipeUrl(username, recipe));
  };

  const handleCreateRecipe = () => {
    const username = getUsernameForUrl(user, profile);
    navigate(generateCreateRecipeUrl(username));
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="my-recipes-page">
          <div className="my-recipes-container">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your recipes...</p>
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
        <div className="my-recipes-page">
          <div className="my-recipes-container">
            <div className="empty-state">
              <h2>Please Sign In</h2>
              <p>You need to be signed in to view your recipes.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="my-recipes-page">
        <div className="my-recipes-container">
          <div className="page-header">
            <div className="header-content">
              <h2 className="page-title">My Recipes</h2>
              <p className="page-subtitle">
                {recipes.length === 0 
                  ? "You haven't created any recipes yet" 
                  : `${recipes.length} recipe${recipes.length === 1 ? '' : 's'}`
                }
              </p>
            </div>
            <button 
              className="create-btn"
              onClick={handleCreateRecipe}
            >
              + Create Recipe
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {recipes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <h3>No recipes yet</h3>
              <p>Create your first recipe to get started!</p>
              <button 
                className="create-btn create-btn-large"
                onClick={handleCreateRecipe}
              >
                Create Your First Recipe
              </button>
            </div>
          ) : (
            <div className="recipes-grid">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="recipe-card">
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
                        Created {new Date(recipe.created_at).toLocaleDateString()}
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
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteRecipe(recipe.id, recipe.title)}
                        disabled={deleteLoading === recipe.id}
                      >
                        {deleteLoading === recipe.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default MyRecipes;