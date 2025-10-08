import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Auth from './Auth';
import { generateMyRecipesUrl, getUsernameForUrl } from '../utils/urlUtils';
import './Navigation.css';

function Navigation() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Listen for global event to open auth modal (triggered from HomePage)
    const openAuthHandler = () => setShowAuth(true);
    window.addEventListener('openAuth', openAuthHandler);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('openAuth', openAuthHandler);
    };
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }
      
      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getDisplayName = () => {
    return userProfile?.full_name || userProfile?.username || user?.email || 'User';
  };

  const getAvatarInitials = () => {
    const name = getDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => navigate('/')}>
            <span className="brand-icon">🍳</span>
            <span className="brand-text">Recipe App</span>
          </div>

          <div className="nav-menu">
            {user ? (
              <div className="user-menu" ref={menuRef}>
                <button
                  className="user-button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-expanded={menuOpen}
                  aria-haspopup="true"
                >
                  <div className="user-avatar">
                    {userProfile?.avatar_url ? (
                      <img src={userProfile.avatar_url} alt="Profile" />
                    ) : (
                      <span>{getAvatarInitials()}</span>
                    )}
                  </div>
                  <span className="user-name">{getDisplayName()}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {menuOpen && (
                  <div className="dropdown-menu" role="menu">
                    <button
                      className="dropdown-item"
                      onClick={() => { navigate('/profile'); setMenuOpen(false); }}
                      role="menuitem"
                    >
                      Profile
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => { 
                        const username = getUsernameForUrl(user, userProfile);
                        navigate(generateMyRecipesUrl(username)); 
                        setMenuOpen(false); 
                      }}
                      role="menuitem"
                    >
                      My recipes
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => { navigate('/saved-recipes'); setMenuOpen(false); }}
                      role="menuitem"
                    >
                      Saved recipes
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => { 
                        const username = getUsernameForUrl(user, userProfile);
                        navigate(`/${username}/create-recipe`); 
                        setMenuOpen(false); 
                      }}
                      role="menuitem"
                    >
                      Create recipe
                    </button>
                    <hr className="dropdown-divider" />
                    <button
                      className="dropdown-item"
                      onClick={handleSignOut}
                      role="menuitem"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="sign-in-button"
                onClick={() => setShowAuth(true)}
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {showAuth && (
        <Auth 
          onClose={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
        />
      )}
    </>
  );
}

export default Navigation;