import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Navigation from '../components/Navigation';
import { generateMyRecipesUrl, getUsernameForUrl } from '../utils/urlUtils';
import './CreateRecipe.css'; // Reusing CreateRecipe styles

function EditRecipe() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [currentImageUrl, setCurrentImageUrl] = useState(''); // Store existing image URL
  
  const [categories, setCategories] = useState([]);
  
  const navigate = useNavigate();
  const { username, recipeId } = useParams();

  // Cleanup preview URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    loadUserCategoriesAndRecipe();
  }, [navigate, username, recipeId]);

  const loadUserCategoriesAndRecipe = async () => {
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

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
      } else {
        setCategories(categoriesData || []);
      }

      // Load existing recipe data
      const { data: recipeData, error: recipeError } = await supabase
        .from('user_recipes')
        .select('*')
        .eq('id', recipeId)
        .eq('user_id', currentUser.id) // Ensure user can only edit their own recipes
        .single();

      if (recipeError) {
        if (recipeError.code === 'PGRST116') {
          setError('Recipe not found or you do not have permission to edit it.');
        } else {
          throw recipeError;
        }
        return;
      }

      // Populate form with existing recipe data
      setTitle(recipeData.title || '');
      setCategory(recipeData.category || '');
      setIngredients(recipeData.ingredients || ['']);
      setSteps(recipeData.steps || ['']);
      setCurrentImageUrl(recipeData.image_url || '');

    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load recipe: ${err.message}`);
    } finally {
      setPageLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Revoke previous blob URL
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      
      setImage(file);
      setImageUrl(URL.createObjectURL(file));
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const uploadImage = async () => {
    if (!image) return currentImageUrl; // Return existing image URL if no new image

    try {
      const fileExt = image.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, image);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw new Error(`Failed to upload image: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;

    // Basic validation
    if (!title.trim()) {
      setError('Recipe title is required');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.trim());
    if (validIngredients.length === 0) {
      setError('At least one ingredient is required');
      return;
    }

    const validSteps = steps.filter(step => step.trim());
    if (validSteps.length === 0) {
      setError('At least one step is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Upload new image if provided, otherwise keep existing
      let finalImageUrl = currentImageUrl;
      if (image) {
        // Delete old image if it exists and we're uploading a new one
        if (currentImageUrl) {
          try {
            console.log('Attempting to delete old image:', currentImageUrl);
            
            const url = new URL(currentImageUrl);
            const pathParts = url.pathname.split('/');
            
            console.log('URL pathname:', url.pathname);
            console.log('Path parts:', pathParts);
            
            // Look for both 'recipe-images' and 'recipe_images' bucket names
            let bucketIndex = pathParts.findIndex(part => part === 'recipe-images');
            if (bucketIndex === -1) {
              bucketIndex = pathParts.findIndex(part => part === 'recipe_images');
            }
            console.log('Bucket index:', bucketIndex);
            
            if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
              const filePath = pathParts.slice(bucketIndex + 1).join('/');
              console.log('Extracted file path:', filePath);
              
              let { data: deleteData, error: storageError } = await supabase.storage
                .from('recipe-images')
                .remove([filePath]);
                
              if (storageError) {
                console.error('Storage deletion error with recipe-images:', storageError);
                
                // Try with recipe_images bucket
                const result = await supabase.storage
                  .from('recipe_images')
                  .remove([filePath]);
                  
                if (result.error) {
                  console.error('Storage deletion error with recipe_images:', result.error);
                } else {
                  console.log('Old image deleted successfully from recipe_images:', result.data);
                }
              } else {
                console.log('Old image deleted successfully from recipe-images:', deleteData);
              }
            } else {
              console.warn('Could not find recipe-images bucket in URL path');
              
              // Alternative approach
              const urlParts = currentImageUrl.split('/');
              const possibleFilename = urlParts[urlParts.length - 1];
              
              if (possibleFilename && possibleFilename.includes('.')) {
                console.log('Trying alternative path extraction:', possibleFilename);
                
                const bucketNames = ['recipe-images', 'recipe_images'];
                const possiblePaths = [
                  possibleFilename,
                  `${user.id}/${possibleFilename}`,
                ];
                
                let deleted = false;
                for (const bucketName of bucketNames) {
                  if (deleted) break;
                  
                  for (const path of possiblePaths) {
                    console.log(`Trying to delete from bucket '${bucketName}' with path:`, path);
                    
                    const { error: altError } = await supabase.storage
                      .from(bucketName)
                      .remove([path]);
                      
                    if (!altError) {
                      console.log(`Successfully deleted old image from '${bucketName}' using path:`, path);
                      deleted = true;
                      break;
                    } else {
                      console.warn(`Failed to delete from '${bucketName}' using path '${path}':`, altError);
                    }
                  }
                }
                
                if (!deleted) {
                  console.error('Failed to delete old image using all attempted methods');
                }
              }
            }
          } catch (imageError) {
            console.error('Error deleting old image:', imageError);
            // Continue with update even if old image deletion fails
          }
        }
        
        finalImageUrl = await uploadImage();
      }

      // Update recipe in database
      const { error: updateError } = await supabase
        .from('user_recipes')
        .update({
          title: title.trim(),
          category: category,
          ingredients: validIngredients,
          steps: validSteps,
          image_url: finalImageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Recipe updated successfully!');
      
      // Redirect to my recipes after a short delay
      setTimeout(() => {
        const userUsername = getUsernameForUrl(user, profile);
        navigate(generateMyRecipesUrl(userUsername));
      }, 2000);

    } catch (err) {
      console.error('Error updating recipe:', err);
      setError(`Failed to update recipe: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <>
        <Navigation />
        <div className="create-recipe-page">
          <div className="create-recipe-container">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading recipe...</p>
            </div>
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
            <h1 className="page-title">Edit Recipe</h1>
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

          <form onSubmit={handleSubmit} className="recipe-form">
            {/* Recipe Title */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">Recipe Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
                placeholder="Enter recipe title"
                required
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category" className="form-label">Category *</label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Recipe Image */}
            <div className="form-group">
              <label htmlFor="image" className="form-label">Recipe Image</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="form-input file-input"
              />
              {(imageUrl || currentImageUrl) && (
                <div className="image-preview">
                  <img 
                    src={imageUrl || currentImageUrl} 
                    alt="Recipe preview" 
                    className="preview-image"
                  />
                </div>
              )}
            </div>

            {/* Ingredients */}
            <div className="form-group">
              <label className="form-label">Ingredients *</label>
              <div className="dynamic-list">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="list-item">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      className="form-input"
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    {ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="remove-btn"
                        title="Remove ingredient"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIngredient}
                  className="add-btn"
                >
                  + Add Ingredient
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="form-group">
              <label className="form-label">Cooking Steps *</label>
              <div className="dynamic-list">
                {steps.map((step, index) => (
                  <div key={index} className="list-item">
                    <textarea
                      value={step}
                      onChange={(e) => updateStep(index, e.target.value)}
                      className="form-textarea"
                      placeholder={`Step ${index + 1}`}
                      rows="3"
                    />
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="remove-btn"
                        title="Remove step"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addStep}
                  className="add-btn"
                >
                  + Add Step
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  const userUsername = getUsernameForUrl(user, profile);
                  navigate(generateMyRecipesUrl(userUsername));
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading ? 'Updating Recipe...' : 'Update Recipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default EditRecipe;