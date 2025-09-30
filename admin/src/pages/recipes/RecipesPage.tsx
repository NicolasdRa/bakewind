import { Component, createSignal, For, Show } from "solid-js";

interface Recipe {
  id: string;
  name: string;
  category: 'bread' | 'pastry' | 'cake' | 'cookies' | 'muffins';
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number; // minutes
  cookTime: number; // minutes
  totalTime: number; // minutes
  servings: number;
  yield: string;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>;
  instructions: string[];
  notes?: string;
  tags: string[];
  nutritionInfo?: {
    calories: number;
    fat: number;
    carbs: number;
    protein: number;
  };
  createdAt: string;
  updatedAt: string;
}

const RecipesPage: Component = () => {
  const [recipes] = createSignal<Recipe[]>([
    {
      id: '1',
      name: 'Classic Chocolate Chip Cookies',
      category: 'cookies',
      difficulty: 'easy',
      prepTime: 15,
      cookTime: 12,
      totalTime: 27,
      servings: 24,
      yield: '24 cookies',
      ingredients: [
        { name: 'All-purpose flour', amount: 2.25, unit: 'cups' },
        { name: 'Baking soda', amount: 1, unit: 'tsp' },
        { name: 'Salt', amount: 1, unit: 'tsp' },
        { name: 'Butter', amount: 1, unit: 'cup', notes: 'softened' },
        { name: 'Granulated sugar', amount: 0.75, unit: 'cup' },
        { name: 'Brown sugar', amount: 0.75, unit: 'cup', notes: 'packed' },
        { name: 'Vanilla extract', amount: 2, unit: 'tsp' },
        { name: 'Large eggs', amount: 2, unit: 'pieces' },
        { name: 'Chocolate chips', amount: 2, unit: 'cups' }
      ],
      instructions: [
        'Preheat oven to 375°F (190°C).',
        'In a medium bowl, whisk together flour, baking soda, and salt.',
        'In a large bowl, cream together butter and both sugars until light and fluffy.',
        'Beat in eggs one at a time, then vanilla.',
        'Gradually mix in flour mixture until just combined.',
        'Stir in chocolate chips.',
        'Drop rounded tablespoons of dough onto ungreased baking sheets.',
        'Bake for 9-11 minutes or until golden brown.',
        'Cool on baking sheet for 2 minutes before removing to wire rack.'
      ],
      tags: ['classic', 'popular', 'beginner-friendly'],
      nutritionInfo: {
        calories: 190,
        fat: 9,
        carbs: 26,
        protein: 2
      },
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Artisan Sourdough Bread',
      category: 'bread',
      difficulty: 'hard',
      prepTime: 30,
      cookTime: 45,
      totalTime: 1200, // includes fermentation time
      servings: 12,
      yield: '1 large loaf',
      ingredients: [
        { name: 'Sourdough starter', amount: 100, unit: 'g', notes: 'active and bubbly' },
        { name: 'Bread flour', amount: 400, unit: 'g' },
        { name: 'Whole wheat flour', amount: 100, unit: 'g' },
        { name: 'Water', amount: 375, unit: 'ml', notes: 'room temperature' },
        { name: 'Salt', amount: 10, unit: 'g' }
      ],
      instructions: [
        'Mix starter with water until dissolved.',
        'Add flours and mix until shaggy dough forms.',
        'Autolyse for 30 minutes.',
        'Add salt and mix thoroughly.',
        'Bulk fermentation with folds every 30 minutes for 4 hours.',
        'Pre-shape and rest 30 minutes.',
        'Final shape and place in banneton.',
        'Retard in refrigerator overnight.',
        'Preheat Dutch oven to 475°F (245°C).',
        'Score and bake covered 20 minutes, uncovered 20-25 minutes.'
      ],
      tags: ['artisan', 'sourdough', 'advanced'],
      createdAt: '2024-01-10',
      updatedAt: '2024-02-15'
    }
  ]);

  const [selectedCategory, setSelectedCategory] = createSignal<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = createSignal<string>('all');
  const [searchTerm, setSearchTerm] = createSignal('');
  const [selectedRecipe, setSelectedRecipe] = createSignal<Recipe | null>(null);

  const filteredRecipes = () => {
    let filtered = recipes();

    if (selectedCategory() !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory());
    }

    if (selectedDifficulty() !== 'all') {
      filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty());
    }

    if (searchTerm()) {
      const term = searchTerm().toLowerCase();
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(term) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return filtered;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Recipe Management</h1>
        <p class="text-gray-600">Manage your bakery's recipe collection</p>
      </div>

      {/* Filter Controls */}
      <div class="mb-6 bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search Recipes</label>
            <input
              type="text"
              placeholder="Search by name or tags..."
              value={searchTerm()}
              onChange={(e) => setSearchTerm(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory()}
              onChange={(e) => setSelectedCategory(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              <option value="bread">Bread</option>
              <option value="pastry">Pastry</option>
              <option value="cake">Cake</option>
              <option value="cookies">Cookies</option>
              <option value="muffins">Muffins</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <select
              value={selectedDifficulty()}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
              Add Recipe
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipe List */}
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">
                Recipes ({filteredRecipes().length})
              </h2>
            </div>
            <Show
              when={filteredRecipes().length > 0}
              fallback={
                <div class="p-6 text-center text-gray-500">
                  No recipes found matching your criteria.
                </div>
              }
            >
              <div class="divide-y divide-gray-200">
                <For each={filteredRecipes()}>
                  {(recipe) => (
                    <div
                      class="p-6 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center space-x-3 mb-2">
                            <h3 class="text-lg font-medium text-gray-900">{recipe.name}</h3>
                            <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                              {recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)}
                            </span>
                          </div>

                          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-2">
                            <div>
                              <span class="font-medium">Category:</span> {recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1)}
                            </div>
                            <div>
                              <span class="font-medium">Prep:</span> {formatTime(recipe.prepTime)}
                            </div>
                            <div>
                              <span class="font-medium">Cook:</span> {formatTime(recipe.cookTime)}
                            </div>
                            <div>
                              <span class="font-medium">Yield:</span> {recipe.yield}
                            </div>
                          </div>

                          <div class="flex flex-wrap gap-1">
                            <For each={recipe.tags}>
                              {(tag) => (
                                <span class="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                                  {tag}
                                </span>
                              )}
                            </For>
                          </div>
                        </div>

                        <div class="flex space-x-2 ml-4">
                          <button class="text-primary-600 hover:text-primary-900 text-sm">Edit</button>
                          <button class="text-gray-600 hover:text-gray-900 text-sm">Duplicate</button>
                        </div>
                      </div>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>

        {/* Recipe Detail */}
        <div class="lg:col-span-1">
          <Show
            when={selectedRecipe()}
            fallback={
              <div class="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                Select a recipe to view details
              </div>
            }
          >
            {(recipe) => (
              <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h2 class="text-lg font-semibold text-gray-900">{recipe().name}</h2>
                  <p class="text-sm text-gray-600 mt-1">
                    Total time: {formatTime(recipe().totalTime)} | Serves: {recipe().servings}
                  </p>
                </div>

                <div class="p-6 space-y-6">
                  {/* Ingredients */}
                  <div>
                    <h3 class="text-md font-semibold text-gray-900 mb-3">Ingredients</h3>
                    <ul class="space-y-1 text-sm">
                      <For each={recipe().ingredients}>
                        {(ingredient) => (
                          <li class="text-gray-700">
                            {ingredient.amount} {ingredient.unit} {ingredient.name}
                            <Show when={ingredient.notes}>
                              <span class="text-gray-500 italic"> ({ingredient.notes})</span>
                            </Show>
                          </li>
                        )}
                      </For>
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 class="text-md font-semibold text-gray-900 mb-3">Instructions</h3>
                    <ol class="space-y-2 text-sm">
                      <For each={recipe().instructions}>
                        {(instruction, index) => (
                          <li class="text-gray-700">
                            <span class="font-medium text-primary-600">{index() + 1}.</span> {instruction}
                          </li>
                        )}
                      </For>
                    </ol>
                  </div>

                  {/* Nutrition Info */}
                  <Show when={recipe().nutritionInfo}>
                    <div>
                      <h3 class="text-md font-semibold text-gray-900 mb-3">Nutrition (per serving)</h3>
                      <div class="grid grid-cols-2 gap-2 text-sm">
                        <div>Calories: {recipe().nutritionInfo!.calories}</div>
                        <div>Fat: {recipe().nutritionInfo!.fat}g</div>
                        <div>Carbs: {recipe().nutritionInfo!.carbs}g</div>
                        <div>Protein: {recipe().nutritionInfo!.protein}g</div>
                      </div>
                    </div>
                  </Show>

                  <div class="flex space-x-2">
                    <button class="flex-1 px-3 py-2 bg-primary-600 text-white text-sm rounded hover:bg-primary-700">
                      Schedule Production
                    </button>
                    <button class="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  );
};

export default RecipesPage;