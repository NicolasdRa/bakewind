import { Component, createSignal, For, Show, onMount } from "solid-js";
import DashboardPageLayout from "~/layouts/DashboardPageLayout";
import StatsCard from "~/components/common/StatsCard";
import SearchInput from "~/components/common/SearchInput";
import FilterSelect from "~/components/common/FilterSelect";
import RecipeDetailsModal from "~/components/recipes/RecipeDetailsModal";
import RecipeFormModal from "~/components/recipes/RecipeFormModal";
import { recipesApi, Recipe, RecipeCategory, CreateRecipeRequest, UpdateRecipeRequest } from "~/api/recipes";
import Badge from "~/components/common/Badge";
import Button from "~/components/common/Button";
import { PlusIcon } from "~/components/icons";
import { Heading, Text } from "~/components/common/Typography";
import { getRecipeCategoryColor } from "~/components/common/Badge.config";
import { useInfoModal } from "~/stores/infoModalStore";
import styles from "./RecipesPage.module.css";

type SortField = 'name' | 'prepTime' | 'totalTime';
type SortDirection = 'asc' | 'desc';

// Adapter type for the UI (simplified ingredient format)
interface UIRecipe extends Omit<Recipe, 'ingredients' | 'yield' | 'yieldUnit' | 'tags' | 'nutritionalInfo'> {
  yield: string; // Combined yield + yieldUnit for display
  tags: string[]; // Always an array (convert null to empty array)
  nutritionalInfo?: {  // Convert null to undefined for modal compatibility
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
  };
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>;
}

const RecipesPage: Component = () => {
  const { showError } = useInfoModal();
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

  // Delete modal state
  const [recipeToDelete, setRecipeToDelete] = createSignal<UIRecipe | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = createSignal(false);

  // Convert API Recipe to UI Recipe format
  const convertToUIRecipe = (recipe: Recipe): UIRecipe => ({
    ...recipe,
    yield: `${recipe.yield} ${recipe.yieldUnit}`,
    tags: recipe.tags || [], // Convert null to empty array
    nutritionalInfo: recipe.nutritionalInfo || undefined, // Convert null to undefined
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
      // Extract error message from API response or use fallback
      const errorMessage = err?.data?.message || err?.message || 'Failed to load recipes';
      const statusCode = err?.status;
      const displayMessage = statusCode === 403
        ? `Access denied: ${errorMessage}. You may not have permission to view recipes.`
        : errorMessage;
      setError(displayMessage);
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
      const errorMessage = err?.data?.message || err?.message || 'Failed to save recipe';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Delete handlers
  const handleDeleteClick = (recipe: UIRecipe) => {
    setRecipeToDelete(recipe);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    const recipe = recipeToDelete();
    if (!recipe) return;

    try {
      setLoading(true);
      await recipesApi.deleteRecipe(recipe.id);
      setShowDeleteConfirm(false);
      setRecipeToDelete(undefined);
      await fetchRecipes();
    } catch (err: any) {
      console.error('Error deleting recipe:', err);
      const message = err.message || 'Failed to delete recipe';
      setShowDeleteConfirm(false);
      setRecipeToDelete(undefined);
      showError('Cannot Delete Recipe', message);
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRecipeToDelete(undefined);
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

  const formatCategoryName = (category: RecipeCategory) => {
    return category ? category.charAt(0).toUpperCase() + category.slice(1) : 'N/A';
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Render sort indicator
  const SortIndicator = (field: SortField) => {
    const isActive = () => sortField() === field;
    return (
      <span class={styles.sortIndicator}>
        <span
          class={styles.sortArrow}
          classList={{
            [styles.sortArrowActive]: isActive() && sortDirection() === 'asc',
            [styles.sortArrowInactive]: !isActive() || sortDirection() !== 'asc'
          }}
        >
          ▲
        </span>
        <span
          class={styles.sortArrow}
          classList={{
            [styles.sortArrowActive]: isActive() && sortDirection() === 'desc',
            [styles.sortArrowInactive]: !isActive() || sortDirection() !== 'desc'
          }}
        >
          ▼
        </span>
      </span>
    );
  };

  return (
    <DashboardPageLayout
      title="Recipe Management"
      subtitle="Manage your bakery's recipe collection"
      actions={
        <Button
          variant="primary"
          size="md"
          onClick={handleOpenCreateModal}
          disabled={loading()}
        >
          <PlusIcon class={styles.buttonIcon} />
          <span class="btn-text">Add Recipe</span>
        </Button>
      }
    >
      {/* Error Display */}
      <Show when={error()}>
        <div class={styles.errorBox}>
          <p class={styles.errorText}>{error()}</p>
        </div>
      </Show>

      {/* Loading State */}
      <Show when={loading() && recipes().length === 0}>
        <div class={styles.loadingText}>Loading recipes...</div>
      </Show>

      {/* Stats Cards */}
      <div class={styles.statsGrid}>
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
      <div class={styles.filterCard}>
        <div class={styles.filterRow}>
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
      <div class={styles.tableContainer}>
        <Show
          when={sortedAndFilteredRecipes().length > 0}
          fallback={
            <div class={styles.emptyState}>
              No recipes found for the selected criteria.
            </div>
          }
        >
          <div class={styles.tableWrapper}>
            <table class={styles.table}>
              <thead class={styles.tableHead}>
                <tr>
                  <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('name')}>
                    <div class={`${styles.headerContent} ${styles.minWidth180}`}>
                      <span>Recipe Name</span>
                      {SortIndicator('name')}
                    </div>
                  </th>
                  <th class={styles.tableHeaderCell}>
                    <div class={styles.minWidth100}>Category</div>
                  </th>
                  <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('prepTime')}>
                    <div class={`${styles.headerContent} ${styles.minWidth100}`}>
                      <span>Prep Time</span>
                      {SortIndicator('prepTime')}
                    </div>
                  </th>
                  <th class={styles.tableHeaderCellSortable} onClick={() => handleSort('totalTime')}>
                    <div class={`${styles.headerContent} ${styles.minWidth110}`}>
                      <span>Total Time</span>
                      {SortIndicator('totalTime')}
                    </div>
                  </th>
                  <th class={styles.tableHeaderCell}>
                    <div class={styles.minWidth90}>Yield</div>
                  </th>
                  <th class={styles.tableHeaderCell}>
                    <div class={styles.minWidth100}>Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <For each={sortedAndFilteredRecipes()}>
                  {(recipe) => (
                    <tr class={styles.tableRow}>
                      <td class={styles.tableCellWrap}>
                        <div>
                          <div class={styles.recipeName}>{recipe.name}</div>
                          <div class={styles.tagsRow}>
                            <For each={recipe.tags.slice(0, 3)}>
                              {(tag) => (
                                <Badge size="sm" variant="neutral" rounded="md">
                                  {tag}
                                </Badge>
                              )}
                            </For>
                          </div>
                        </div>
                      </td>
                      <td class={styles.tableCell}>
                        <Badge color={getRecipeCategoryColor(recipe.category)}>
                          {formatCategoryName(recipe.category)}
                        </Badge>
                      </td>
                      <td class={styles.tableCell}>
                        <span class={styles.timeText}>{formatTime(recipe.prepTime)}</span>
                      </td>
                      <td class={styles.tableCell}>
                        <span class={styles.totalTimeText}>{formatTime(recipe.totalTime)}</span>
                      </td>
                      <td class={styles.tableCell}>
                        <span class={styles.yieldText}>{recipe.yield}</span>
                      </td>
                      <td class={styles.tableCell}>
                        <div class={styles.actionsRow}>
                          <Button variant="text" size="sm" onClick={() => setSelectedRecipe(recipe)}>
                            View
                          </Button>
                          <Button variant="text" size="sm" onClick={() => handleOpenEditModal(recipe)}>
                            Edit
                          </Button>
                          <Button variant="text" size="sm" onClick={() => handleDeleteClick(recipe)} class={styles.deleteLink}>
                            Delete
                          </Button>
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

      {/* Delete Confirmation Dialog */}
      <Show when={showDeleteConfirm()}>
        <div class={styles.modalBackdrop} onClick={handleCancelDelete}>
          <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Heading variant="card" class={styles.modalTitle}>Delete Recipe</Heading>
            <Text class={styles.modalText}>
              Are you sure you want to delete "{recipeToDelete()?.name}"? This action cannot be undone.
            </Text>
            <div class={styles.modalActions}>
              <Button variant="secondary" size="sm" onClick={handleCancelDelete}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </Show>
    </DashboardPageLayout>
  );
};

export default RecipesPage;