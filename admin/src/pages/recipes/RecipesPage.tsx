import { Component, createSignal, For, Show, onMount, createEffect } from "solid-js";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import RecipeDetailsModal from "~/components/recipes/RecipeDetailsModal";
import RecipeFormModal from "~/components/recipes/RecipeFormModal";
import { recipesApi, Recipe, RecipeCategory, CreateRecipeRequest, UpdateRecipeRequest } from "~/api/recipes";

type SortField = 'name' | 'prepTime' | 'totalTime';
type SortDirection = 'asc' | 'desc';

// Adapter type for the UI (simplified ingredient format)
interface UIRecipe extends Omit<Recipe, 'ingredients' | 'yield' | 'yieldUnit'> {
  yield: string; // Combined yield + yieldUnit for display
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>;
}

const RecipesPage: Component = () => {
  const [recipes, setRecipes] = createSignal<UIRecipe[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const [selectedCategory, setSelectedCategory] = createSignal<RecipeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = createSignal('');
  const [selectedRecipe, setSelectedRecipe] = createSignal<UIRecipe | null>(null);

  // Sorting state
  const [sortField, setSortField] = createSignal<SortField>('name');
  const [sortDirection, setSortDirection] = createSignal<SortDirection>('asc');

  // Form modal state
  const [isFormModalOpen, setIsFormModalOpen] = createSignal(false);
  const [formMode, setFormMode] = createSignal<'create' | 'edit'>('create');
  const [recipeToEdit, setRecipeToEdit] = createSignal<UIRecipe | null>(null);

  // Convert API Recipe to UI Recipe format
  const convertToUIRecipe = (recipe: Recipe): UIRecipe => ({
    ...recipe,
    yield: `${recipe.yield} ${recipe.yieldUnit}`,
    ingredients: recipe.ingredients.map(ing => ({
      name: ing.ingredientName,
      amount: ing.quantity,
      unit: ing.unit,
      notes: ing.notes || undefined,
    })),
  });

  // Fetch recipes from API
  const fetchRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await recipesApi.getRecipes();
      setRecipes(data.map(convertToUIRecipe));
    } catch (err: any) {
      console.error('Error fetching recipes:', err);
      setError(err.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  // Load recipes on mount
  onMount(() => {
    fetchRecipes();
  });

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField() === field) {
      setSortDirection(sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle opening the create modal
  const handleOpenCreateModal = () => {
    setFormMode('create');
    setRecipeToEdit(null);
    setIsFormModalOpen(true);
  };

  // Handle opening the edit modal
  const handleOpenEditModal = (recipe: UIRecipe) => {
    setFormMode('edit');
    setRecipeToEdit(recipe);
    setSelectedRecipe(null); // Close details modal
    setIsFormModalOpen(true);
  };

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true);
      if (formMode() === 'create') {
        // Convert UI format to API format
        const createData: CreateRecipeRequest = {
          name: data.name,
          category: data.category,
          description: data.description,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          yield: data.yield ? parseInt(data.yield.split(' ')[0]) : 1,
          yieldUnit: data.yield ? data.yield.split(' ').slice(1).join(' ') : 'servings',
          ingredients: data.ingredients.map((ing: any) => ({
            ingredientId: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
            ingredientName: ing.name,
            quantity: ing.amount,
            unit: ing.unit,
            cost: 0,
            notes: ing.notes || undefined,
          })),
          instructions: data.instructions,
          tags: data.tags,
          allergens: [],
          nutritionalInfo: data.nutritionInfo,
        };
        await recipesApi.createRecipe(createData);
      } else {
        // Update existing recipe
        const updateData: UpdateRecipeRequest = {
          name: data.name,
          category: data.category,
          description: data.description,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          yield: data.yield ? parseInt(data.yield.split(' ')[0]) : 1,
          yieldUnit: data.yield ? data.yield.split(' ').slice(1).join(' ') : 'servings',
          ingredients: data.ingredients.map((ing: any) => ({
            ingredientId: '00000000-0000-0000-0000-000000000000', // Placeholder UUID
            ingredientName: ing.name,
            quantity: ing.amount,
            unit: ing.unit,
            cost: 0,
            notes: ing.notes || undefined,
          })),
          instructions: data.instructions,
          tags: data.tags,
          nutritionalInfo: data.nutritionInfo,
        };
        await recipesApi.updateRecipe(recipeToEdit()!.id, updateData);
      }
      // Refresh the list
      await fetchRecipes();
      setIsFormModalOpen(false);
    } catch (err: any) {
      console.error('Error saving recipe:', err);
      setError(err.message || 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  const sortedAndFilteredRecipes = () => {
    let filtered = recipes();

    // Apply category filter
    if (selectedCategory() !== 'all') {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory());
    }

    // Apply search filter
    const search = searchQuery().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(search) ||
        (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(search)))
      );
    }

    // Apply sorting
    const field = sortField();
    const direction = sortDirection();

    return [...filtered].sort((a, b) => {
      let aValue: number | string = 0;
      let bValue: number | string = 0;

      switch (field) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'prepTime':
          aValue = a.prepTime;
          bValue = b.prepTime;
          break;
        case 'totalTime':
          aValue = a.totalTime;
          bValue = b.totalTime;
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return direction === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
      }
    });
  };

  const getCategoryColor = (category: RecipeCategory) => {
    const colors: Record<RecipeCategory, string> = {
      bread: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
      pastry: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200',
      cake: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      cookie: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
      sandwich: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      beverage: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      sauce: 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200',
      filling: 'bg-violet-100 dark:bg-violet-900 text-violet-800 dark:text-violet-200',
      topping: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200',
      other: 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200',
    };
    return colors[category] || colors.other;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Render sort indicator
  const SortIndicator = (field: SortField) => {
    const isActive = sortField() === field;
    return (
      <span class="ml-1 inline-flex flex-col" style={{ "line-height": "0.5" }}>
        <span
          class="text-[10px] transition-colors"
          style={{
            color: isActive && sortDirection() === 'asc'
              ? 'var(--primary-color)'
              : 'var(--text-tertiary)',
            opacity: isActive && sortDirection() === 'asc' ? '1' : '0.4'
          }}
        >
          ▲
        </span>
        <span
          class="text-[10px] transition-colors"
          style={{
            color: isActive && sortDirection() === 'desc'
              ? 'var(--primary-color)'
              : 'var(--text-tertiary)',
            opacity: isActive && sortDirection() === 'desc' ? '1' : '0.4'
          }}
        >
          ▼
        </span>
      </span>
    );
  };

  return (
    <div class="p-6 md:p-8">
      <div class="mb-8 flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold mb-2" style="color: var(--text-primary)">Recipe Management</h1>
          <p class="text-base" style="color: var(--text-secondary)">Manage your bakery's recipe collection</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          disabled={loading()}
          class="px-6 py-3 rounded-lg font-medium transition-all hover:opacity-90"
          style={{
            "background-color": "var(--primary-color)",
            "color": "white",
            opacity: loading() ? '0.6' : '1'
          }}
        >
          + Add Recipe
        </button>
      </div>

      {/* Error Display */}
      <Show when={error()}>
        <div class="mb-6 p-4 rounded-lg" style={{ "background-color": "var(--error-light)", "border": "1px solid var(--error-color)" }}>
          <p class="text-sm" style={{ color: "var(--error-color)" }}>{error()}</p>
        </div>
      </Show>

      {/* Loading State */}
      <Show when={loading() && recipes().length === 0}>
        <div class="flex justify-center items-center py-12">
          <div class="text-lg" style="color: var(--text-secondary)">Loading recipes...</div>
        </div>
      </Show>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Total Recipes"
          value={recipes().length}
          valueColor="var(--primary-color)"
        />
        <StatsCard
          title="Bread & Pastry"
          value={recipes().filter(r => r.category === 'bread' || r.category === 'pastry').length}
          valueColor="var(--success-color)"
        />
        <StatsCard
          title="Avg Prep Time"
          value={`${Math.round(recipes().reduce((sum, r) => sum + r.prepTime, 0) / recipes().length)}m`}
          valueColor="var(--info-color)"
        />
      </div>

      {/* Filter Controls */}
      <div class="mb-8 rounded-xl p-5 border" style={{
        "background-color": "var(--bg-primary)",
        "border-color": "var(--border-color)",
        "box-shadow": "var(--shadow-card)"
      }}>
        <div class="flex flex-wrap gap-4">
          <SearchInput
            value={searchQuery()}
            onInput={setSearchQuery}
            placeholder="Search by name or tags..."
            label="Search Recipes"
          />
          <FilterSelect
            value={selectedCategory()}
            onChange={(value) => setSelectedCategory(value as RecipeCategory | 'all')}
            label="Category"
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'bread', label: 'Bread' },
              { value: 'pastry', label: 'Pastry' },
              { value: 'cake', label: 'Cake' },
              { value: 'cookie', label: 'Cookie' },
              { value: 'sandwich', label: 'Sandwich' },
              { value: 'beverage', label: 'Beverage' },
              { value: 'sauce', label: 'Sauce' },
              { value: 'filling', label: 'Filling' },
              { value: 'topping', label: 'Topping' },
              { value: 'other', label: 'Other' }
            ]}
          />
        </div>
      </div>

      {/* Recipes Table */}
      <div class="rounded-xl border overflow-hidden mb-8" style={{
        "background-color": "var(--bg-primary)",
        "border-color": "var(--border-color)",
        "box-shadow": "var(--shadow-card)"
      }}>
        <Show
          when={sortedAndFilteredRecipes().length > 0}
          fallback={
            <div class="p-12 text-center" style="color: var(--text-secondary)">
              No recipes found for the selected criteria.
            </div>
          }
        >
          <div class="overflow-x-auto">
            <table class="min-w-full" style={{
              "border-collapse": "separate",
              "border-spacing": 0
            }}>
              <thead style="background-color: var(--bg-tertiary)">
                <tr>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                    style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}
                    onClick={() => handleSort('name')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div class="flex items-center justify-between w-full min-w-[180px]">
                      <span>Recipe Name</span>
                      {SortIndicator('name')}
                    </div>
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                    "color": "var(--text-secondary)",
                    "border-color": "var(--border-color)"
                  }}>
                    <div class="min-w-[100px]">Category</div>
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                    style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}
                    onClick={() => handleSort('prepTime')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div class="flex items-center justify-between w-full min-w-[100px]">
                      <span>Prep Time</span>
                      {SortIndicator('prepTime')}
                    </div>
                  </th>
                  <th
                    class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer select-none transition-all group"
                    style={{
                      "color": "var(--text-secondary)",
                      "border-color": "var(--border-color)"
                    }}
                    onClick={() => handleSort('totalTime')}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <div class="flex items-center justify-between w-full min-w-[110px]">
                      <span>Total Time</span>
                      {SortIndicator('totalTime')}
                    </div>
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                    "color": "var(--text-secondary)",
                    "border-color": "var(--border-color)"
                  }}>
                    <div class="min-w-[90px]">Yield</div>
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider border-b" style={{
                    "color": "var(--text-secondary)",
                    "border-color": "var(--border-color)"
                  }}>
                    <div class="min-w-[100px]">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={sortedAndFilteredRecipes()}>
                  {(recipe) => (
                    <tr class="transition-colors border-b" style={{
                      "border-color": "var(--border-light)"
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td class="px-6 py-4">
                        <div>
                          <div class="text-sm font-medium mb-1" style="color: var(--text-primary)">{recipe.name}</div>
                          <div class="flex flex-wrap gap-1">
                            <For each={recipe.tags.slice(0, 3)}>
                              {(tag) => (
                                <span class="inline-flex px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                                  {tag}
                                </span>
                              )}
                            </For>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <span class={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getCategoryColor(recipe.category)}`}>
                          {recipe.category ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) : 'N/A'}
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--text-tertiary)">
                        {formatTime(recipe.prepTime)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium" style="color: var(--text-primary)">
                        {formatTime(recipe.totalTime)}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm" style="color: var(--text-tertiary)">
                        {recipe.yield}
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <div class="flex space-x-3">
                          <button
                            onClick={() => setSelectedRecipe(recipe)}
                            class="font-medium transition-colors"
                            style={{
                              "color": "var(--primary-color)"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--primary-color)"}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(recipe)}
                            class="font-medium transition-colors"
                            style={{
                              "color": "var(--primary-color)"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = "var(--primary-hover)"}
                            onMouseLeave={(e) => e.currentTarget.style.color = "var(--primary-color)"}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>

      {/* Recipe Details Modal */}
      <RecipeDetailsModal
        isOpen={selectedRecipe() !== null}
        recipe={selectedRecipe()}
        onClose={() => setSelectedRecipe(null)}
        onEdit={() => {
          const recipe = selectedRecipe();
          if (recipe) handleOpenEditModal(recipe);
        }}
      />

      {/* Recipe Form Modal */}
      <RecipeFormModal
        isOpen={isFormModalOpen()}
        mode={formMode()}
        recipe={recipeToEdit() || undefined}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
};

export default RecipesPage;