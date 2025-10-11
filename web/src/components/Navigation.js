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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const menuRef = useRef(null);
  const searchRef = useRef(null);
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

  // Close menu and search results on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
    }
    if (menuOpen || showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, showSearchResults]);

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

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    setShowSearchResults(true);

    try {
      // Search for users by username or full name
      // Handle both boolean and string values for is_public_profile
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, is_public_profile')
        .in('is_public_profile', [true, 'true'])
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
        return;
      }

      setSearchResults(users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]); // handleSearch is defined above and uses supabase which is stable

  const handleUserSelect = (selectedUser) => {
    const username = getUsernameForUrl({ id: selectedUser.id }, selectedUser);
    navigate(`/user/${username}`);
    setShowSearchResults(false);
    setSearchQuery('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleUserSelect(searchResults[0]);
    }
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
            <div className="search-container" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="search-form">
                <div className="search-input-wrapper">
                  <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }
                    }}
                    className="search-input"
                  />
                </div>
              </form>
              
              {showSearchResults && (
                <div className="search-results">
                  {searchLoading ? (
                    <div className="search-loading">
                      <div className="spinner-small"></div>
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <ul className="search-results-list">
                      {searchResults.map((user) => (
                        <li 
                          key={user.id} 
                          className="search-result-item"
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="search-user-avatar">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.full_name || user.username} />
                            ) : (
                              <span>{(user.full_name || user.username || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="search-user-info">
                            <div className="search-user-name">{user.full_name || user.username}</div>
                            {user.full_name && user.username && (
                              <div className="search-user-username">@{user.username}</div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : searchQuery ? (
                    <div className="search-no-results">
                      <span>No users found</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

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
                      onClick={() => { navigate('/'); setMenuOpen(false); }}
                      role="menuitem"
                    >
                      Home
                    </button>
                    <hr className="dropdown-divider" />
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