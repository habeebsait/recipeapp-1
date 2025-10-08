import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import './RecipeView.css';

function RecipeView() {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadRecipe() {
      try {
        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select('*')
          .eq('id', id)
          .eq('is_public', true)
          .single();

        if (recipeError) {
          if (recipeError.code === 'PGRST116') {
            setError('Recipe not found or not public');
          } else {
            throw recipeError;
          }
          setLoading(false);
          return;
        }

        setRecipe(recipeData);
        
      } catch (err) {
        console.error('Error loading recipe:', err);
        setError(`Failed to load recipe: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadRecipe();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="recipe-view-page">
          <div className="recipe-view-container">
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
        <div className="recipe-view-page">
          <div className="recipe-view-container">
            <div className="error-state">
              <h2>Recipe Not Found</h2>
              <p>{error || 'The recipe you\'re looking for doesn\'t exist or is not public.'}</p>
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

  // Parse ingredients and steps (assuming they're stored as text with newlines or commas)
  const ingredientsList = recipe.ingredients 
    ? recipe.ingredients.split('\n').filter(item => item.trim())
    : [];
  
  const stepsList = recipe.steps 
    ? recipe.steps.split('\n').filter(item => item.trim())
    : [];

  return (
    <>
      <Navigation />
      <div className="recipe-view-page">
        <div className="recipe-view-container">
          <div className="recipe-header">
            <div className="breadcrumb">
              <button 
                className="breadcrumb-link"
                onClick={() => navigate('/')}
              >
                Home
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
              </div>
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
                  {ingredientsList.length > 0 ? (
                    <ul>
                      {ingredientsList.map((ingredient, index) => (
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
                  {stepsList.length > 0 ? (
                    <ol>
                      {stepsList.map((step, index) => (
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

export default RecipeView;