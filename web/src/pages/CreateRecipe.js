import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { generateMyRecipesUrl, getUsernameForUrl } from '../utils/urlUtils';
import './CreateRecipe.css';

function CreateRecipe() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  
  const [categories, setCategories] = useState([]);
  
  const navigate = useNavigate();

  // Cleanup preview URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    async function loadUserAndCategories() {
      // Check authentication
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (!currentUser) {
        navigate('/');
        return;
      }

      // Load user profile
      try {
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
      } catch (err) {
        console.error('Error loading profile:', err);
      }

      // Load categories
      try {
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('id, name')
          .order('name');
        
        if (!categoryError) {
          setCategories(categoryData || []);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    }

    loadUserAndCategories();
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clean up previous preview URL
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    
    // Store the file and create a new preview URL
    setImage(file);
    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);
  };

  // Array handling functions for ingredients
  const handleIngredientChange = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  // Array handling functions for steps
  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      const newSteps = steps.filter((_, i) => i !== index);
      setSteps(newSteps);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Please sign in to create a recipe');
      return;
    }

    // Validate form fields
    const validIngredients = ingredients.filter(ing => ing.trim() !== '');
    const validSteps = steps.filter(step => step.trim() !== '');
    
    if (!title.trim() || !category.trim() || validIngredients.length === 0 || validSteps.length === 0) {
      setError('Please fill in all required fields and add at least one ingredient and one step');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Verify user authentication before proceeding
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      let finalImageUrl = null;
      
      // Upload image if one is selected
      if (image) {
        try {
          const fileExt = image.name.split('.').pop();
          const fileName = `recipe_${currentUser.id}_${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(fileName, image, { 
              cacheControl: '3600',
              upsert: true 
            });
          
          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('recipe-images').getPublicUrl(fileName);
          finalImageUrl = data.publicUrl;
          
        } catch (uploadErr) {
          console.error('Image upload error:', uploadErr);
          throw new Error(`Failed to upload image: ${uploadErr.message}`);
        }
      }
      
      const selectedCategory = categories.find(cat => cat.name === category);
      
      // Filter out empty entries and trim whitespace
      const cleanIngredients = ingredients.filter(ing => ing.trim() !== '').map(ing => ing.trim());
      const cleanSteps = steps.filter(step => step.trim() !== '').map(step => step.trim());
      
      const recipeData = {
        user_id: currentUser.id, // Use currentUser.id to ensure latest auth state
        title: title.trim(),
        category: category.trim(),
        category_id: selectedCategory?.id || null,
        ingredients: cleanIngredients,
        steps: cleanSteps,
        image_url: finalImageUrl
      };

      console.log('Inserting recipe data:', recipeData); // For debugging

      const { data, error: insertError } = await supabase
        .from('user_recipes')
        .insert([recipeData])
        .select()
        .single();

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      console.log('Recipe created successfully:', data); // For debugging

      // Clean up preview URL since we've successfully uploaded the actual image
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }

      setSuccess('Recipe created successfully!');
      
      // Redirect to My Recipes after a short delay
      setTimeout(() => {
        const username = getUsernameForUrl(currentUser, profile);
        navigate(generateMyRecipesUrl(username));
      }, 1500);
      
    } catch (err) {
      console.error('Error creating recipe:', err);
      setError(`Failed to create recipe: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <Navigation />
        <div className="create-recipe-page">
          <div className="create-recipe-container">
            <p>Please sign in to create recipes.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="create-recipe-page">
        <div className="create-recipe-container">
          <div className="page-header">
            <h2 className="page-title">Create New Recipe</h2>
            <button 
              type="button"
              className="recipe-btn recipe-btn-secondary"
              onClick={() => {
                const username = getUsernameForUrl(user, profile);
                navigate(generateMyRecipesUrl(username));
              }}
            >
              ← Back to My Recipes
            </button>
          </div>

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

          <form className="recipe-form" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="title">Recipe Title *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter recipe title"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <input
                  id="category"
                  type="text"
                  list="categories"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter or select category"
                  required
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label htmlFor="image">Recipe Image</label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
                {imageUrl && (
                  <div className="image-preview">
                    <img src={imageUrl} alt="Recipe preview" />
                  </div>
                )}
              </div>
            </div>

            <div className="form-section">
              <h3>Ingredients</h3>
              <div className="form-group">
                <label>Ingredients List *</label>
                <div className="array-inputs">
                  {ingredients.map((ingredient, index) => (
                    <div key={index} className="array-input-row">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        placeholder={`Ingredient ${index + 1}`}
                        className="array-input"
                      />
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="remove-btn"
                        disabled={ingredients.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="add-btn"
                  >
                    Add Ingredient
                  </button>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Instructions</h3>
              <div className="form-group">
                <label>Cooking Steps *</label>
                <div className="array-inputs">
                  {steps.map((step, index) => (
                    <div key={index} className="array-input-row">
                      <div className="step-number">{index + 1}.</div>
                      <textarea
                        value={step}
                        onChange={(e) => handleStepChange(index, e.target.value)}
                        placeholder={`Step ${index + 1} instructions`}
                        className="array-textarea"
                        rows={3}
                      />
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="remove-btn"
                        disabled={steps.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addStep}
                    className="add-btn"
                  >
                    Add Step
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="recipe-btn recipe-btn-secondary"
                onClick={() => {
                  const username = getUsernameForUrl(user, profile);
                  navigate(generateMyRecipesUrl(username));
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="recipe-btn recipe-btn-primary"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Recipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default CreateRecipe;