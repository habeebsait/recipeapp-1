import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { generateRecipeUrl, generateMyRecipesUrl, getUsernameForUrl } from '../utils/urlUtils';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  
  // Profile form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [isPublicProfile, setIsPublicProfile] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    async function loadUserProfileAndRecipes() {
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
          .select('username, full_name, avatar_url, email, is_public_profile, created_at, updated_at')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error loading profile:', profileError);
        } else if (userProfile) {
          setProfile(userProfile);
          setFullName(userProfile.full_name || '');
          setUsername(userProfile.username || '');
          setAvatarUrl(userProfile.avatar_url || '');
          setEmail(userProfile.email || currentUser.email || '');
          setIsPublicProfile(userProfile.is_public_profile || false);
        }

        // Load user's recent recipes
        const { data: recipeData, error: recipeError } = await supabase
          .from('user_recipes')
          .select(`
            id,
            title,
            category,
            ingredients,
            steps,
            image_url,
            created_at
          `)
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(6);

        if (recipeError) {
          throw recipeError;
        }

        setRecipes(recipeData || []);
        
      } catch (err) {
        console.error('Error loading profile:', err);
        setError(`Failed to load profile: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfileAndRecipes();
  }, [navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!user) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updates = {
        id: user.id,
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        email: email.trim() || user.email,
        is_public_profile: isPublicProfile,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProfile({
        ...profile,
        full_name: updates.full_name,
        username: updates.username,
        avatar_url: updates.avatar_url,
        email: updates.email,
        is_public_profile: updates.is_public_profile
      });

      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error updating profile:', err);
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleViewRecipe = (recipe) => {
    const userUsername = getUsernameForUrl(user, profile);
    navigate(generateRecipeUrl(userUsername, recipe));
  };

  const handleViewAllRecipes = () => {
    const userUsername = getUsernameForUrl(user, profile);
    navigate(generateMyRecipesUrl(userUsername));
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError(`Failed to sign out: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="profile-page">
          <div className="profile-container">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading your profile...</p>
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
        <div className="profile-page">
          <div className="profile-container">
            <div className="empty-state">
              <h2>Please Sign In</h2>
              <p>You need to be signed in to view your profile.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="profile-page">
        <div className="profile-container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="profile-content">
            {/* Green header section with user info */}
            <div className="profile-header-section">
              <div className="user-avatar-large">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile Avatar" />
                ) : (
                  <span>{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}</span>
                )}
              </div>
              <h2 className="profile-name">Profile</h2>
              
              <form onSubmit={handleUpdateProfile} className="profile-info-form">
                <div className="profile-field">
                  <label>Name :</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="profile-field">
                  <label>Username :</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter a username"
                  />
                </div>

                <div className="profile-field">
                  <label>Avatar URL :</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Enter avatar image URL"
                  />
                </div>

                <div className="profile-field">
                  <label>Mail :</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="profile-field toggle-field">
                  <label>Public Profile</label>
                  <div className="toggle-switch">
                    <input 
                      type="checkbox" 
                      id="publicToggle"
                      checked={isPublicProfile}
                      onChange={(e) => setIsPublicProfile(e.target.checked)}
                    />
                    <label htmlFor="publicToggle" className="toggle-label"></label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="update-profile-btn"
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>

            {/* My Recipes section */}
            <div className="my-recipes-section">
              <h3 className="recipes-title">My Recipes</h3>
              
              {recipes.length === 0 ? (
                <div className="empty-recipes">
                  <div className="empty-icon">📝</div>
                  <h4>No recipes yet</h4>
                  <p>Start creating recipes to see them here!</p>
                  <button 
                    className="create-recipe-btn"
                    onClick={handleViewAllRecipes}
                  >
                    Create Your First Recipe
                  </button>
                </div>
              ) : (
                <div className="recipes-grid">
                  {recipes.map((recipe) => (
                    <div 
                      key={recipe.id} 
                      className="recipe-card"
                      onClick={() => handleViewRecipe(recipe)}
                    >
                      <h4 className="recipe-card-title">{recipe.title}</h4>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;