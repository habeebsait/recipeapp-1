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
            .eq('user_recipe_id', recipeData.id)
            .maybeSingle();

          if (savedData && !savedError) {
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
          .eq('user_recipe_id', recipe.id);

        if (error) throw error;
        setIsSaved(false);
      } else {
        // Add to saved recipes
        const { error } = await supabase
          .from('saved_recipes')
          .insert([{
            user_id: user.id,
            user_recipe_id: recipe.id,
            category: recipe.category
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
            <div className="loading-state">
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
          {/* Hero Image Section */}
          {recipe.image_url && (
            <div className="recipe-hero">
              <img 
                src={recipe.image_url} 
                alt={recipe.title}
                className="recipe-hero-image"
              />
            </div>
          )}

          {/* Recipe Header */}
          <div className="recipe-header">
            <div className="recipe-title-section">
              <h1 className="recipe-title">{recipe.title}</h1>
              <p className="recipe-author">
                By {recipeOwnerProfile?.full_name || recipeOwnerProfile?.username || 'Chef Anonymous'}
              </p>
            </div>

            <div className="recipe-actions">
              {user && (
                <button 
                  className={`action-btn save-btn ${isSaved ? 'saved' : ''}`}
                  onClick={handleSaveRecipe}
                  disabled={saveLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  {saveLoading ? 'Saving...' : (isSaved ? 'Saved' : 'Save')}
                </button>
              )}

              <button className="action-btn share-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92S21 19.61 21 18s-1.31-2.92-2.92-2.92z"/>
                </svg>
                Share
              </button>
            </div>
          </div>

          {/* Recipe Content */}
          <div className="recipe-content">
            <div className="recipe-sections">
              <div className="ingredients-section">
                <h2 className="section-title">Ingredients</h2>
                <ul className="ingredients-list">
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="ingredient-item">
                        <span className="ingredient-bullet">•</span>
                        <span className="ingredient-text">{ingredient}</span>
                      </li>
                    ))
                  ) : (
                    <li className="empty-message">No ingredients listed</li>
                  )}
                </ul>
              </div>

              <div className="instructions-section">
                <h2 className="section-title">Instructions</h2>
                <ol className="instructions-list">
                  {recipe.steps && recipe.steps.length > 0 ? (
                    recipe.steps.map((step, index) => (
                      <li key={index} className="instruction-item">
                        <span className="instruction-number">{index + 1}.</span>
                        <span className="instruction-text">{step}</span>
                      </li>
                    ))
                  ) : (
                    <li className="empty-message">No instructions provided</li>
                  )}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default RecipeDetail;