'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Clock, Utensils, AlertCircle, Upload, Search, Check, Copy } from 'lucide-react';

interface PantryItem {
  id: string;
  name: string;
  shelfLifeDays: number;
  category?: string;
}

interface Recipe {
  recipeName: string;
  cookingTime: string;
  difficulty: string;
  usedIngredients: string[];
  missingIngredients: string[];
  instructions: string[];
}

export default function Dashboard() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'expiring'>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('r2p_pantry');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('r2p_pantry', JSON.stringify(items));
  }, [items]);

  // 1. Manual Text Entry
  const handleAnalyzeText = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textInput }),
      });

      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        const newItems = data.items.map((item: any, idx: number) => ({
          id: Date.now().toString() + idx,
          name: item.name,
          shelfLifeDays: item.shelfLifeDays || 5,
          category: item.category || 'Grocery',
        }));
        setItems((prev) => [...prev, ...newItems]);
        setTextInput('');
      } else {
        const manualItems = textInput.split(',').map((str, idx) => ({
          id: Date.now().toString() + idx,
          name: str.trim(),
          shelfLifeDays: (idx % 2 === 0) ? 3 : 7,
          category: 'Grocery',
        })).filter(i => i.name.length > 0);
        setItems((prev) => [...prev, ...manualItems]);
        setTextInput('');
      }
    } catch (err) {
      const manualItems = textInput.split(',').map((str, idx) => ({
        id: Date.now().toString() + idx,
        name: str.trim(),
        shelfLifeDays: 4,
        category: 'Grocery',
      })).filter(i => i.name.length > 0);
      setItems((prev) => [...prev, ...manualItems]);
      setTextInput('');
    } finally {
      setLoading(false);
    }
  };

  // 2. Client-Side Image Compression & Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressedBase64 }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.items && Array.isArray(data.items)) {
              const newItems = data.items.map((item: any, idx: number) => ({
                id: Date.now().toString() + idx,
                name: item.name,
                shelfLifeDays: item.shelfLifeDays || 5,
                category: item.category || 'Receipt Item',
              }));
              setItems((prev) => [...prev, ...newItems]);
            } else {
              setError(data.error || 'Could not scan image. Try a clearer photo or manual input.');
            }
          })
          .catch(() => setError('Failed to process image.'))
          .finally(() => setLoading(false));
      };
    };
    reader.readAsDataURL(file);
  };

  // 3. AI Recipe Generation
  const handleGenerateRecipes = async () => {
    if (items.length === 0) {
      setError('Please add items to your Virtual Pantry first.');
      return;
    }
    setRecipeLoading(true);
    setError('');

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ name: i.name, shelfLifeDays: i.shelfLifeDays })),
          timeLimit: '30m',
        }),
      });

      const data = await res.json();
      if (data.recipes && Array.isArray(data.recipes)) {
        setRecipes(data.recipes);
      } else {
        setError(data.error || 'Could not generate recipes.');
      }
    } catch (err) {
      setError('Error reaching recipe generator.');
    } finally {
      setRecipeLoading(false);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearAll = () => {
    setItems([]);
    setRecipes([]);
    localStorage.removeItem('r2p_pantry');
  };

  const copyRecipe = (recipe: Recipe, index: number) => {
    const text = `🍳 ${recipe.recipeName}\n⏱️ Time: ${recipe.cookingTime} | Difficulty: ${recipe.difficulty}\n\nIngredients: ${recipe.usedIngredients.join(', ')}\n\nSteps:\n${recipe.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter & Search Logic
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'expiring' ? item.shelfLifeDays <= 3 : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 text-slate-800">
      {/* SECTION 1: INPUT */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-800">
          <Utensils className="w-5 h-5 text-emerald-600"/> 1. Add Grocery Items or Scan Receipt
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-emerald-300 bg-emerald-50/30 rounded-xl p-6 text-center hover:bg-emerald-50 transition flex flex-col items-center justify-center relative cursor-pointer">
            <Upload className="w-8 h-8 text-emerald-600 mb-2"/>
            <p className="text-sm font-semibold text-slate-700">
              {loading ? 'AI Scanning Image...' : 'Upload Receipt Photo'}
            </p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG, or JPEG</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={loading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type items manually (e.g. Milk, Apples, Bread, Chicken)..."
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 text-sm"
              rows={3}
            />
            <button
              onClick={handleAnalyzeText}
              disabled={loading || !textInput.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl transition disabled:opacity-50 text-sm"
            >
              {loading ? 'Adding Items...' : 'Analyze & Save to Pantry'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: VIRTUAL PANTRY */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              2. Virtual Pantry ({items.length} items)
            </h2>
            <p className="text-xs text-slate-500">Color badges reflect freshness & expiration urgency.</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/>
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={() => setFilter(filter === 'all' ? 'expiring' : 'all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                filter === 'expiring'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {filter === 'expiring' ? 'Showing Expiring' : 'Filter Expiring'}
            </button>
            {items.length > 0 && (
              <button
                onClick={clearAll}
                className="text-red-500 text-xs font-semibold hover:underline flex items-center gap-1 ml-2"
              >
                <Trash2 className="w-3.5 h-3.5"/> Clear
              </button>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
            <p className="text-slate-400 text-sm">
              {items.length === 0 ? 'Your pantry is empty. Upload a receipt or type items above!' : 'No items match your filter.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {filteredItems.map((item) => {
              const isExpiringSoon = item.shelfLifeDays <= 3;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition ${
                    isExpiringSoon
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <span>{item.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                      isExpiringSoon
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    <Clock className="w-3 h-3"/>
                    {isExpiringSoon ? `${item.shelfLifeDays}d (Expiring)` : `${item.shelfLifeDays}d (Fresh)`}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-slate-400 hover:text-red-600 font-bold ml-1 text-base"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3: ZERO-WASTE RECIPE ENGINE */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500"/> 3. Zero-Waste AI Recipe Engine
            </h2>
            <p className="text-xs text-slate-500">
              Generates custom recipes tailored to your pantry items.
            </p>
          </div>
          <button
            onClick={handleGenerateRecipes}
            disabled={recipeLoading || items.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition disabled:opacity-50 text-sm flex items-center gap-2 shadow-sm"
          >
            {recipeLoading ? 'AI Chef is Cooking...' : 'Generate Zero-Waste Recipes'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0"/>
            <span>{error}</span>
          </div>
        )}

        {/* LOADING SKELETON */}
        {recipeLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-slate-100 rounded-2xl p-5 space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="space-y-2 pt-4">
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded"></div>
                  <div className="h-3 bg-slate-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RECIPES */}
        {!recipeLoading && recipes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {recipes.map((recipe, index) => (
              <div
                key={index}
                className="border border-amber-200 rounded-2xl p-5 bg-amber-50/30 flex flex-col justify-between shadow-sm hover:shadow-md transition relative group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {recipe.recipeName}
                    </h3>
                    <button
                      onClick={() => copyRecipe(recipe, index)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-amber-100/50 rounded-lg transition"
                      title="Copy Recipe"
                    >
                      {copiedIndex === index ? <Check className="w-4 h-4 text-emerald-600"/> : <Copy className="w-4 h-4"/>}
                    </button>
                  </div>

                  <div className="flex gap-2 text-xs">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-medium">
                      ⏱️ {recipe.cookingTime}
                    </span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-medium">
                      📊 {recipe.difficulty}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 pt-2">
                    <div>
                      <strong className="text-emerald-700 block mb-0.5">Used Ingredients:</strong>
                      <p className="text-slate-600">{recipe.usedIngredients?.join(', ')}</p>
                    </div>
                    <div>
                      <strong className="text-slate-500 block mb-0.5">Extra Staples Needed:</strong>
                      <p className="text-slate-600">{recipe.missingIngredients?.join(', ') || 'None'}</p>
                    </div>
                    <div>
                      <strong className="text-slate-900 block mb-0.5">Cooking Steps:</strong>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600">
                        {recipe.instructions?.map((step, sIdx) => (
                          <li key={sIdx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}