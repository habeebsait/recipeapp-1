import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RecipeDetail from './pages/RecipeDetail';
import RecipeView from './pages/RecipeView';
import Profile from './pages/Profile';
import MyRecipes from './pages/MyRecipes';
import SavedRecipes from './pages/SavedRecipes';
import CreateRecipe from './pages/CreateRecipe';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/saved-recipes" element={<SavedRecipes />} />
        <Route path="/create-recipe" element={<CreateRecipe />} />
        <Route path="/recipe/:id" element={<RecipeView />} />
        <Route path="/:username" element={<Profile />} />
        <Route path="/:username/my-recipes" element={<MyRecipes />} />
        <Route path="/:username/create-recipe" element={<CreateRecipe />} />
        <Route path="/:username/my-recipes/:recipeSlug" element={<RecipeDetail />} />
        {/* Fallback routes for backward compatibility */}
        <Route path="/my-recipes" element={<MyRecipes />} />
      </Routes>
    </Router>
  );
}

export default App;