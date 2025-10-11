import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { getUsernameForUrl, generateRecipeUrl } from '../utils/urlUtils';
import './UserProfile.css';

function UserProfile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saveLoading, setSaveLoading] = useState(null);
  const [savedRecipes, setSavedRecipes] = useState(new Set());
  
  const { username } = useParams();
  const navigate = useNavigate();

  // Helper: Generate subtitle for recipes
  const getRecipeSubtitle = (recipe) => {
    const title = (recipe?.title || '').toLowerCase();
    if (title.includes('pasta')) return 'A rich and flavorful pasta dish.';
    if (title.includes('salad')) return 'A refreshing and healthy salad.';
    if (title.includes('cake') || title.includes('chocolate')) return 'A decadent chocolate dessert.';
    if (title.includes('chili') || title.includes('vegan')) return 'Hearty and packed with flavor.';
    if (recipe?.category) return `A delicious ${recipe.category.toLowerCase()} recipe.`;
    return 'A delicious recipe to try.';
  };

  useEffect(() => {
    async function loadUserProfile() {
      try {
        // Get current authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setCurrentUser(authUser);

        // Load saved recipes for current user if authenticated
        if (authUser) {
          const { data: savedData } = await supabase
            .from('saved_recipes')
            .select('user_recipe_id')
            .eq('user_id', authUser.id);
          
          if (savedData) {
            setSavedRecipes(new Set(savedData.map(item => item.user_recipe_id)));
          }
        }

        // Find the profile user by username
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, is_public_profile')
          .eq('username', username)
          .single();

        if (profileError) {
          console.error('Profile query error:', profileError);
          console.error('Looking for username:', username);
          throw new Error('User not found');
        }

        console.log('Found profile:', profiles);
        console.log('is_public_profile value:', profiles.is_public_profile, 'type:', typeof profiles.is_public_profile);

        // Handle both boolean and string values for is_public_profile
        const isPublic = profiles.is_public_profile === true || profiles.is_public_profile === 'true';
        
        if (!isPublic) {
          throw new Error('This profile is private');
        }

        setProfileUser(profiles);

        // Load the user's public recipes
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
          .eq('user_id', profiles.id)
          .order('created_at', { ascending: false });

        if (recipeError) {
          throw recipeError;
        }

        setRecipes(recipeData || []);
        
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError(err.message || 'Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [username]);

  const handleSaveRecipe = async (recipe) => {
    if (!currentUser) {
      alert('Please sign in to save recipes');
      return;
    }

    const isCurrentlySaved = savedRecipes.has(recipe.id);

    try {
      setSaveLoading(recipe.id);

      if (isCurrentlySaved) {
        // Remove from saved recipes
        const { error } = await supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('user_recipe_id', recipe.id);

        if (error) throw error;

        setSavedRecipes(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipe.id);
          return newSet;
        });
      } else {
        // Add to saved recipes
        // Note: If you get a NOT NULL constraint error, you need to run this SQL:
        // ALTER TABLE saved_recipes ALTER COLUMN recipe_id DROP NOT NULL;
        
        const insertData = {
          user_id: currentUser.id,
          user_recipe_id: recipe.id,
          category: recipe.category
          // Omitting recipe_id - it should default to NULL
        };

        const { error } = await supabase
          .from('saved_recipes')
          .insert([insertData]);

        if (error) {
          console.error('Save recipe error:', error);
          console.error('This error suggests recipe_id has NOT NULL constraint');
          console.error('Run this SQL to fix: ALTER TABLE saved_recipes ALTER COLUMN recipe_id DROP NOT NULL;');
          throw new Error(`Database schema issue: ${error.message}`);
        }

        setSavedRecipes(prev => new Set([...prev, recipe.id]));
      }
    } catch (err) {
      console.error('Error saving recipe:', err);
      alert(`Failed to ${isCurrentlySaved ? 'remove' : 'save'} recipe: ${err.message}`);
    } finally {
      setSaveLoading(null);
    }
  };

  const handleViewRecipe = (recipe) => {
    const recipeOwnerUsername = getUsernameForUrl({ id: profileUser.id }, profileUser);
    navigate(generateRecipeUrl(recipeOwnerUsername, recipe));
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="user-profile-page">
          <div className="user-profile-container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading profile...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !profileUser) {
    return (
      <>
        <Navigation />
        <div className="user-profile-page">
          <div className="user-profile-container">
            <div className="error-state">
              <h2>Profile Not Found</h2>
              <p>{error || 'The profile you\'re looking for doesn\'t exist or is private.'}</p>
              <button 
                className="btn btn-primary"
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

  const displayName = profileUser.full_name || profileUser.username;
  const avatarInitials = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <>
      <Navigation />
      <div className="user-profile-page">
        <div className="user-profile-container">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar-large">
              {profileUser.avatar_url ? (
                <img src={profileUser.avatar_url} alt={displayName} />
              ) : (
                <span>{avatarInitials}</span>
              )}
            </div>
            <div className="profile-info">
              <h1 className="profile-display-name">{displayName}</h1>
              {profileUser.full_name && profileUser.username && (
                <p className="profile-username">@{profileUser.username}</p>
              )}
              <div className="profile-stats">
                <span className="stat">
                  <strong>{recipes.length}</strong> {recipes.length === 1 ? 'Recipe' : 'Recipes'}
                </span>
              </div>
            </div>
          </div>

          {/* Recipes Section */}
          <div className="profile-recipes-section">
            <h2 className="section-title">Recipes</h2>
            
            {recipes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No public recipes yet</h3>
                <p>{displayName} hasn't shared any recipes yet.</p>
              </div>
            ) : (
              <div className="user-recipes-grid">
                {recipes.map((recipe) => (
                  <div 
                    key={recipe.id} 
                    className="user-recipe-card"
                    onClick={() => handleViewRecipe(recipe)}
                  >
                    <div className="recipe-image-container">
                      <div className="user-recipe-image-wrap">
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
                      
                      {/* Save button overlay */}
                      {currentUser && currentUser.id !== profileUser.id && (
                        <button
                          className={`save-overlay-btn ${savedRecipes.has(recipe.id) ? 'saved' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveRecipe(recipe);
                          }}
                          disabled={saveLoading === recipe.id}
                          title={savedRecipes.has(recipe.id) ? 'Remove from saved' : 'Save recipe'}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={savedRecipes.has(recipe.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="user-recipe-info">
                      <h3 className="user-recipe-card-title">{recipe.title}</h3>
                      <p className="user-recipe-card-subtitle">{getRecipeSubtitle(recipe)}</p>
                      <div className="recipe-meta">
                        <span className="recipe-category">{recipe.category}</span>
                        <span className="recipe-date">
                          {new Date(recipe.created_at).toLocaleDateString()}
                        </span>
                      </div>
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

export default UserProfile;