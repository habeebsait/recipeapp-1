import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { parseRecipeSlug, generateMyRecipesUrl, getUsernameForUrl } from '../utils/urlUtils';
import './RecipeDetail.css';

function RecipeDetail() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [recipeOwnerProfile, setRecipeOwnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const { username, recipeSlug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRecipeAndUser() {
      try {
        // Parse recipe ID from slug
        const recipeId = parseRecipeSlug(recipeSlug);
        if (!recipeId) {
          setError('Invalid recipe URL');
          setLoading(false);
          return;
        }

        // Check authentication
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        // Load current user's profile if authenticated
        if (currentUser) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('username, full_name')
            .eq('id', currentUser.id)
            .single();

          if (!profileError) {
            setProfile(userProfile);
          }
        }

        // Load the recipe
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
            updated_at,
            user_id,
            profiles!user_recipes_user_id_fkey (
              username,
              full_name
            )
          `)
          .eq('id', recipeId)
          .single();

        if (recipeError) {
          if (recipeError.code === 'PGRST116') {
            setError('Recipe not found');
          } else {
            throw recipeError;
          }
          setLoading(false);
          return;
        }

        setRecipe(recipeData);
        setRecipeOwnerProfile(recipeData.profiles);

        // Verify that the username in the URL matches the recipe owner
        const recipeOwnerUsername = getUsernameForUrl(
          { id: recipeData.user_id }, 
          recipeData.profiles
        );
        
        if (username !== recipeOwnerUsername) {
          // Redirect to the correct URL
          const correctSlug = `${recipeData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${recipeData.id}`;
          navigate(`/${recipeOwnerUsername}/my-recipes/${correctSlug}`, { replace: true });
          return;
        }

        // Check if recipe is saved by current user (if authenticated)
        if (currentUser) {
          const { data: savedData, error: savedError } = await supabase
            .from('saved_recipes')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('recipe_id', recipeId)
            .single();

          if (!savedError) {
            setIsSaved(true);
          }
        }

      } catch (err) {
        console.error('Error loading recipe:', err);
        setError(`Failed to load recipe: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadRecipeAndUser();
  }, [username, recipeSlug, navigate]);

  const handleSaveRecipe = async () => {
    if (!user) {
      alert('Please sign in to save recipes');
      return;
    }

    if (!recipe) return;

    try {
      setSaveLoading(true);

      if (isSaved) {
        // Remove from saved recipes
        const { error } = await supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipe.id);

        if (error) throw error;
        setIsSaved(false);
      } else {
        // Add to saved recipes
        const { error } = await supabase
          .from('saved_recipes')
          .insert([{
            user_id: user.id,
            recipe_id: recipe.id
          }]);

        if (error) throw error;
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert(`Failed to ${isSaved ? 'remove' : 'save'} recipe: ${err.message}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const isOwner = user && recipe && user.id === recipe.user_id;

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="recipe-detail-page">
          <div className="recipe-detail-container">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading recipe...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !recipe) {
    return (
      <>
        <Navigation />
        <div className="recipe-detail-page">
          <div className="recipe-detail-container">
            <div className="error-state">
              <h2>Recipe Not Found</h2>
              <p>{error || 'The recipe you\'re looking for doesn\'t exist.'}</p>
              <button 
                className="recipe-btn recipe-btn-primary"
                onClick={() => navigate('/')}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="recipe-detail-page">
        <div className="recipe-detail-container">
          <div className="recipe-header">
            <div className="breadcrumb">
              <button 
                className="breadcrumb-link"
                onClick={() => navigate('/')}
              >
                Home
              </button>
              <span className="breadcrumb-separator">→</span>
              <button 
                className="breadcrumb-link"
                onClick={() => {
                  const ownerUsername = getUsernameForUrl(
                    { id: recipe.user_id }, 
                    recipeOwnerProfile
                  );
                  navigate(generateMyRecipesUrl(ownerUsername));
                }}
              >
                {recipeOwnerProfile?.full_name || recipeOwnerProfile?.username || 'User'}'s Recipes
              </button>
              <span className="breadcrumb-separator">→</span>
              <span className="breadcrumb-current">{recipe.title}</span>
            </div>

            <div className="recipe-title-section">
              <h1 className="recipe-title">{recipe.title}</h1>
              <div className="recipe-meta">
                <span className="recipe-category">{recipe.category}</span>
                <span className="recipe-date">
                  Created {new Date(recipe.created_at).toLocaleDateString()}
                </span>
                <span className="recipe-author">
                  by {recipeOwnerProfile?.full_name || recipeOwnerProfile?.username || 'Anonymous'}
                </span>
              </div>
            </div>

            <div className="recipe-actions">
              {!isOwner && user && (
                <button 
                  className={`recipe-btn ${isSaved ? 'recipe-btn-secondary' : 'recipe-btn-primary'}`}
                  onClick={handleSaveRecipe}
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Loading...' : (isSaved ? '❤️ Saved' : '🤍 Save Recipe')}
                </button>
              )}
              {isOwner && (
                <button 
                  className="recipe-btn recipe-btn-secondary"
                  onClick={() => {
                    const userUsername = getUsernameForUrl(user, profile);
                    navigate(generateMyRecipesUrl(userUsername));
                  }}
                >
                  Edit My Recipes
                </button>
              )}
            </div>
          </div>

          <div className="recipe-content">
            {recipe.image_url && (
              <div className="recipe-image-section">
                <img 
                  src={recipe.image_url} 
                  alt={recipe.title}
                  className="recipe-image"
                />
              </div>
            )}

            <div className="recipe-sections">
              <div className="ingredients-section">
                <h2>Ingredients</h2>
                <div className="ingredients-list">
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    <ul>
                      {recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="ingredient-item">
                          <span className="ingredient-text">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty-message">No ingredients listed</p>
                  )}
                </div>
              </div>

              <div className="steps-section">
                <h2>Instructions</h2>
                <div className="steps-list">
                  {recipe.steps && recipe.steps.length > 0 ? (
                    <ol>
                      {recipe.steps.map((step, index) => (
                        <li key={index} className="step-item">
                          <div className="step-number">{index + 1}</div>
                          <div className="step-content">{step}</div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="empty-message">No instructions provided</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RecipeDetail;