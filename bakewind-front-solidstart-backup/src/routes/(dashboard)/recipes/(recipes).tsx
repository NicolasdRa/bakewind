import { createSignal, For, Show, onMount, createEffect } from 'solid-js'
import { useBakeryStore } from '~/stores/bakeryStore'
import { bakeryActions } from '~/stores/bakeryStore'
import SEO from '~/components/SEO/SEO'
import ViewToggle from '~/components/ViewToggle/ViewToggle'
import ActionButton from '~/components/ActionButton/ActionButton'
import styles from './recipes.module.css'
import type { Recipe, RecipeIngredient } from '~/types/bakery'

export default function Recipes() {
  const { state, actions } = useBakeryStore()
  
  onMount(() => {
    // Ensure mock data is loaded
    bakeryActions.loadMockData()
    console.log('Recipes page loaded, recipe count:', state.recipes.list.length)
  })

  createEffect(() => {
    console.log('Recipes state changed:', {
      count: state.recipes.list.length,
      loading: state.recipes.loading,
      recipes: state.recipes.list.map(r => r.name)
    })
  })
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedCategory, setSelectedCategory] = createSignal<string>('all')
  const [sortBy, setSortBy] = createSignal<'name' | 'cost' | 'margin' | 'prepTime'>('name')
  const [selectedRecipe, setSelectedRecipe] = createSignal<Recipe | null>(null)
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [viewMode, setViewMode] = createSignal<'cards' | 'list'>('cards')

  const viewModeOptions = [
    { 
      value: 'cards', 
      label: 'Cards', 
      mobileIcon: '📱', 
      desktopLabel: 'Cards',
      title: 'Card View' 
    },
    { 
      value: 'list', 
      label: 'List', 
      mobileIcon: '📋', 
      desktopLabel: 'List',
      title: 'List View' 
    }
  ]

  const categories = [
    { value: 'all', label: 'All Recipes' },
    ...state.recipes.categories.map(cat => ({ value: cat, label: cat }))
  ]

  const filteredRecipes = () => {
    let recipes = state.recipes.list.filter(recipe => recipe.active)

    if (selectedCategory() !== 'all') {
      recipes = recipes.filter(recipe => recipe.category === selectedCategory())
    }

    if (searchTerm()) {
      const search = searchTerm().toLowerCase()
      recipes = recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(search) ||
        recipe.category.toLowerCase().includes(search) ||
        recipe.tags?.some(tag => tag.toLowerCase().includes(search)) ||
        recipe.ingredients.some(ing => ing.ingredientName.toLowerCase().includes(search))
      )
    }

    return recipes.sort((a, b) => {
      switch (sortBy()) {
        case 'cost':
          return (a.costPerUnit || 0) - (b.costPerUnit || 0)
        case 'margin':
          return (b.margin || 0) - (a.margin || 0)
        case 'prepTime':
          return a.prepTime - b.prepTime
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getTotalTime = (recipe: Recipe) => recipe.prepTime + recipe.cookTime

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getMarginColor = (margin: number | undefined) => {
    if (!margin) return 'var(--text-secondary)'
    if (margin >= 70) return '#059669'
    if (margin >= 50) return '#f59e0b'
    return '#dc2626'
  }

  const scaleRecipe = (recipe: Recipe, scale: number) => {
    return {
      ...recipe,
      ingredients: recipe.ingredients.map(ing => ({
        ...ing,
        quantity: ing.quantity * scale
      })),
      yield: recipe.yield * scale
    }
  }

  return (
    <>
      <SEO
        title="Recipes - BakeWind"
        description="Manage bakery recipes, calculate costs, and scale production"
        path="/recipes"
      />

      <div class={styles.container}>
        <div class={styles.header}>
          <div class={styles.headerContent}>
            <h1 class={styles.title}>Recipe Management</h1>
            <p class={styles.subtitle}>Create, manage, and cost your bakery recipes</p>
          </div>
          
          <div class={styles.headerActions}>
            <ViewToggle 
              options={viewModeOptions}
              currentValue={viewMode()}
              onChange={(mode) => setViewMode(mode as 'cards' | 'list')}
            />
            <ActionButton
              onClick={() => setShowAddModal(true)}
              icon="+"
            >
              New Recipe
            </ActionButton>
          </div>
        </div>

        <div class={styles.statsRow}>
          <div class={styles.statCard}>
            <div class={styles.statValue}>{filteredRecipes().length}</div>
            <div class={styles.statLabel}>Active Recipes</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue}>
              {formatCurrency(filteredRecipes().reduce((avg, recipe) => avg + (recipe.costPerUnit || 0), 0) / filteredRecipes().length)}
            </div>
            <div class={styles.statLabel}>Avg Cost/Unit</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue}>
              {Math.round(filteredRecipes().reduce((avg, recipe) => avg + (recipe.margin || 0), 0) / filteredRecipes().length)}%
            </div>
            <div class={styles.statLabel}>Avg Margin</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue}>
              {Math.round(filteredRecipes().reduce((avg, recipe) => avg + getTotalTime(recipe), 0) / filteredRecipes().length)}m
            </div>
            <div class={styles.statLabel}>Avg Total Time</div>
          </div>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchBar}>
            <input
              type="text"
              placeholder="Search recipes, ingredients, tags..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class={styles.searchInput}
            />
          </div>

          <div class={styles.filters}>
            <select
              value={selectedCategory()}
              onChange={(e) => setSelectedCategory(e.currentTarget.value)}
              class={styles.select}
            >
              <For each={categories}>
                {(category) => (
                  <option value={category.value}>{category.label}</option>
                )}
              </For>
            </select>

            <select
              value={sortBy()}
              onChange={(e) => setSortBy(e.currentTarget.value as any)}
              class={styles.select}
            >
              <option value="name">Sort by Name</option>
              <option value="cost">Sort by Cost</option>
              <option value="margin">Sort by Margin</option>
              <option value="prepTime">Sort by Prep Time</option>
            </select>
          </div>
        </div>

        <Show
          when={!state.recipes.loading && filteredRecipes().length > 0}
          fallback={
            <div class={styles.emptyState}>
              {state.recipes.loading ? 'Loading recipes...' : `No recipes found (${state.recipes.list.length} total recipes, ${filteredRecipes().length} after filters)`}
            </div>
          }
        >
          <div class={viewMode() === 'cards' ? styles.recipesGrid : styles.recipesList}>
            <For each={filteredRecipes()}>
              {(recipe) => (
                <div 
                  class={viewMode() === 'cards' ? styles.recipeCard : styles.recipeRow}
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  <Show when={recipe.imageUrl && viewMode() === 'cards'}>
                    <div class={styles.recipeImage}>
                      <img src={recipe.imageUrl} alt={recipe.name} />
                    </div>
                  </Show>

                  <div class={styles.recipeHeader}>
                    <div class={styles.recipeInfo}>
                      <h3 class={styles.recipeName}>{recipe.name}</h3>
                      <div class={styles.recipeCategory}>{recipe.category}</div>
                    </div>
                    
                    <Show when={viewMode() === 'cards'}>
                      <div class={styles.recipeCost}>
                        <div class={styles.costValue}>{formatCurrency(recipe.costPerUnit)}</div>
                        <div class={styles.costLabel}>Cost per unit</div>
                      </div>
                    </Show>
                  </div>

                  <Show when={recipe.description && viewMode() === 'cards'}>
                    <div class={styles.recipeDescription}>
                      {recipe.description}
                    </div>
                  </Show>

                  <div class={styles.recipeDetails}>
                    <div class={styles.detailItem}>
                      <span class={styles.detailIcon}>⏱️</span>
                      <span class={styles.detailText}>
                        Prep: {formatTime(recipe.prepTime)} | Cook: {formatTime(recipe.cookTime)}
                      </span>
                    </div>
                    
                    <div class={styles.detailItem}>
                      <span class={styles.detailIcon}>🥖</span>
                      <span class={styles.detailText}>
                        Yield: {recipe.yield} {recipe.yieldUnit}
                      </span>
                    </div>

                    <Show when={recipe.margin}>
                      <div class={styles.detailItem}>
                        <span class={styles.detailIcon}>💰</span>
                        <span 
                          class={styles.detailText}
                          style={{ color: getMarginColor(recipe.margin) }}
                        >
                          {recipe.margin!.toFixed(1)}% margin
                        </span>
                      </div>
                    </Show>
                  </div>

                  <Show when={recipe.tags && recipe.tags.length > 0}>
                    <div class={styles.recipeTags}>
                      <For each={recipe.tags!.slice(0, viewMode() === 'cards' ? 3 : 5)}>
                        {(tag) => (
                          <span class={styles.recipeTag}>{tag}</span>
                        )}
                      </For>
                      <Show when={recipe.tags!.length > (viewMode() === 'cards' ? 3 : 5)}>
                        <span class={styles.moreTags}>+{recipe.tags!.length - (viewMode() === 'cards' ? 3 : 5)}</span>
                      </Show>
                    </div>
                  </Show>

                  <Show when={recipe.allergens && recipe.allergens.length > 0}>
                    <div class={styles.allergenWarning}>
                      ⚠️ Contains: {recipe.allergens!.join(', ')}
                    </div>
                  </Show>

                  <Show when={viewMode() === 'list'}>
                    <div class={styles.listActions}>
                      <div class={styles.listCost}>{formatCurrency(recipe.costPerUnit)}</div>
                      <div class={styles.listSelling}>{formatCurrency(recipe.sellingPrice)}</div>
                      <div 
                        class={styles.listMargin}
                        style={{ color: getMarginColor(recipe.margin) }}
                      >
                        {recipe.margin ? `${recipe.margin.toFixed(1)}%` : 'N/A'}
                      </div>
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* Recipe Detail Modal */}
        <Show when={selectedRecipe()}>
          <div class={styles.modal} onClick={() => setSelectedRecipe(null)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <div class={styles.modalTitle}>
                  <h2>{selectedRecipe()!.name}</h2>
                  <span class={styles.modalCategory}>{selectedRecipe()!.category}</span>
                </div>
                <button class={styles.modalClose} onClick={() => setSelectedRecipe(null)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <div class={styles.recipeOverview}>
                  <div class={styles.overviewStats}>
                    <div class={styles.overviewStat}>
                      <div class={styles.statLabel}>Prep Time</div>
                      <div class={styles.statValue}>{formatTime(selectedRecipe()!.prepTime)}</div>
                    </div>
                    <div class={styles.overviewStat}>
                      <div class={styles.statLabel}>Cook Time</div>
                      <div class={styles.statValue}>{formatTime(selectedRecipe()!.cookTime)}</div>
                    </div>
                    <div class={styles.overviewStat}>
                      <div class={styles.statLabel}>Yield</div>
                      <div class={styles.statValue}>{selectedRecipe()!.yield} {selectedRecipe()!.yieldUnit}</div>
                    </div>
                    <div class={styles.overviewStat}>
                      <div class={styles.statLabel}>Cost/Unit</div>
                      <div class={styles.statValue}>{formatCurrency(selectedRecipe()!.costPerUnit)}</div>
                    </div>
                  </div>

                  <Show when={selectedRecipe()!.description}>
                    <div class={styles.description}>
                      <h3>Description</h3>
                      <p>{selectedRecipe()!.description}</p>
                    </div>
                  </Show>
                </div>

                <div class={styles.modalSections}>
                  <div class={styles.ingredientsSection}>
                    <h3>Ingredients</h3>
                    <div class={styles.ingredientsList}>
                      <For each={selectedRecipe()!.ingredients}>
                        {(ingredient) => (
                          <div class={styles.ingredientItem}>
                            <span class={styles.ingredientQuantity}>
                              {ingredient.quantity}{ingredient.unit}
                            </span>
                            <span class={styles.ingredientName}>{ingredient.ingredientName}</span>
                            <Show when={ingredient.cost}>
                              <span class={styles.ingredientCost}>{formatCurrency(ingredient.cost)}</span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class={styles.instructionsSection}>
                    <h3>Instructions</h3>
                    <div class={styles.instructionsList}>
                      <For each={selectedRecipe()!.instructions}>
                        {(instruction, index) => (
                          <div class={styles.instructionItem}>
                            <div class={styles.instructionNumber}>{index() + 1}</div>
                            <div class={styles.instructionText}>{instruction}</div>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                </div>

                <Show when={selectedRecipe()!.nutritionalInfo}>
                  <div class={styles.nutritionSection}>
                    <h3>Nutritional Information (per serving)</h3>
                    <div class={styles.nutritionGrid}>
                      <div class={styles.nutritionItem}>
                        <span class={styles.nutritionLabel}>Calories</span>
                        <span class={styles.nutritionValue}>{selectedRecipe()!.nutritionalInfo!.calories || 'N/A'}</span>
                      </div>
                      <div class={styles.nutritionItem}>
                        <span class={styles.nutritionLabel}>Protein</span>
                        <span class={styles.nutritionValue}>{selectedRecipe()!.nutritionalInfo!.protein || 'N/A'}g</span>
                      </div>
                      <div class={styles.nutritionItem}>
                        <span class={styles.nutritionLabel}>Carbs</span>
                        <span class={styles.nutritionValue}>{selectedRecipe()!.nutritionalInfo!.carbs || 'N/A'}g</span>
                      </div>
                      <div class={styles.nutritionItem}>
                        <span class={styles.nutritionLabel}>Fat</span>
                        <span class={styles.nutritionValue}>{selectedRecipe()!.nutritionalInfo!.fat || 'N/A'}g</span>
                      </div>
                    </div>
                  </div>
                </Show>

                <div class={styles.modalActions}>
                  <button class={styles.modalActionBtn}>Edit Recipe</button>
                  <button class={styles.modalActionBtn}>Scale Recipe</button>
                  <button class={styles.modalActionBtn}>Add to Production</button>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Add Recipe Modal Placeholder */}
        <Show when={showAddModal()}>
          <div class={styles.modal} onClick={() => setShowAddModal(false)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <h2>Create New Recipe</h2>
                <button class={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <p>Recipe creation form would go here...</p>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  )
}