import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { generateRecipeUrl, generateCreateRecipeUrl, generateEditRecipeUrl, getUsernameForUrl } from '../utils/urlUtils';
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

  // Helper: Generate subtitle for recipes
  const getRecipeSubtitle = (recipe) => {
    const title = (recipe?.title || '').toLowerCase();
    if (title.includes('pasta')) return 'A rich and flavorful pasta dish.';
    if (title.includes('salad')) return 'A refreshing and healthy salad.';
    if (title.includes('cake') || title.includes('chocolate')) return 'A decadent chocolate dessert.';
    if (title.includes('chili') || title.includes('vegan')) return 'Hearty and packed with flavor.';
    if (recipe?.category) return `A delicious ${recipe.category.toLowerCase()} recipe.`;
    return 'Your delicious homemade recipe.';
  };

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


  const handleDeleteRecipe = (recipeId, recipeTitle) => {
    // Show app install prompt instead of deleting
    const message = `To delete "${recipeTitle}", please install our app for the full experience!\n\nWould you like to install the app now?`;
    
    if (window.confirm(message)) {
      // Trigger app install prompt
      if ('serviceWorker' in navigator && 'BeforeInstallPromptEvent' in window) {
        // Check if there's a deferred install prompt
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          window.deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');
            } else {
              console.log('User dismissed the install prompt');
            }
            window.deferredPrompt = null;
          });
        } else {
          // Fallback: Show instructions for manual installation
          alert('To install the app:\n\n• On Chrome: Click the install icon in the address bar\n• On Safari: Tap the share button and select "Add to Home Screen"\n• On other browsers: Look for "Install App" or "Add to Home Screen" option');
        }
      } else {
        // Fallback for browsers that don't support PWA installation
        alert('Your browser doesn\'t support app installation. Please try using Chrome, Safari, or another modern browser.');
      }
    }
  };

  const handleEditRecipe = (recipe) => {
    const username = getUsernameForUrl(user, profile);
    navigate(generateEditRecipeUrl(username, recipe.id));
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
            <div className="loading-state">
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
            <h1 className="page-title">My Recipes</h1>
            <button 
              className="add-recipe-btn"
              onClick={handleCreateRecipe}
            >
              + Add Recipe
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
                className="add-recipe-btn add-recipe-btn-large"
                onClick={handleCreateRecipe}
              >
                Create Your First Recipe
              </button>
            </div>
          ) : (
            <>
              <div className="my-recipes-grid">
                {recipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    className="my-recipe-card"
                    onClick={() => handleViewRecipe(recipe)}
                  >
                    <div className="my-recipe-image-wrap">
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
                    
                    <h3 className="my-recipe-card-title">{recipe.title}</h3>
                    <p className="my-recipe-card-subtitle">{getRecipeSubtitle(recipe)}</p>

                    <div className="recipe-actions">
                      <button 
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRecipe(recipe);
                        }}
                        title="Edit recipe"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecipe(recipe.id, recipe.title);
                        }}
                        disabled={deleteLoading === recipe.id}
                        title="Delete recipe"
                      >
                        {deleteLoading === recipe.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <button className="pagination-btn prev" disabled>
                  &lt;
                </button>
                <button className="pagination-btn active">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <button className="pagination-btn next">
                  &gt;
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default MyRecipes;