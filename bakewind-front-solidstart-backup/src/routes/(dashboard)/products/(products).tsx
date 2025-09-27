import { createSignal, For, Show, onMount } from 'solid-js'
import { useBakeryStore } from '~/stores/bakeryStore'
import { bakeryActions } from '~/stores/bakeryStore'
import SEO from '~/components/SEO/SEO'
import ViewToggle from '~/components/ViewToggle/ViewToggle'
import ActionButton from '~/components/ActionButton/ActionButton'
import styles from './products.module.css'
import type { Product, ProductCategory, ProductStatus, Recipe } from '~/types/bakery'

export default function Products() {
  const { state, actions } = useBakeryStore()
  const [searchTerm, setSearchTerm] = createSignal('')
  const [selectedCategory, setSelectedCategory] = createSignal<ProductCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = createSignal<ProductStatus | 'all'>('all')
  const [sortBy, setSortBy] = createSignal<'name' | 'category' | 'price' | 'popularity' | 'margin'>('name')
  const [selectedProduct, setSelectedProduct] = createSignal<Product | null>(null)
  const [showAddModal, setShowAddModal] = createSignal(false)
  const [showRecipeModal, setShowRecipeModal] = createSignal(false)
  const [selectedRecipe, setSelectedRecipe] = createSignal<Recipe | null>(null)
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

  onMount(() => {
    bakeryActions.loadMockData()
  })

  const getCategoryIcon = (category: ProductCategory) => {
    switch (category) {
      case 'bread': return '🍞'
      case 'pastry': return '🥐'
      case 'cake': return '🎂'
      case 'cookie': return '🍪'
      case 'sandwich': return '🥪'
      case 'beverage': return '☕'
      case 'seasonal': return '🍂'
      case 'custom': return '🎨'
      default: return '🥐'
    }
  }

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'inactive': return '#6b7280'
      case 'seasonal': return '#f59e0b'
      case 'discontinued': return '#dc2626'
      default: return '#6b7280'
    }
  }

  const filteredProducts = () => {
    let products = state.products.list

    // Filter by category
    if (selectedCategory() !== 'all') {
      products = products.filter(product => product.category === selectedCategory())
    }

    // Filter by status
    if (selectedStatus() !== 'all') {
      products = products.filter(product => product.status === selectedStatus())
    }

    // Filter by search term
    if (searchTerm()) {
      const search = searchTerm().toLowerCase()
      products = products.filter(product =>
        product.name.toLowerCase().includes(search) ||
        product.description?.toLowerCase().includes(search) ||
        product.tags?.some(tag => tag.toLowerCase().includes(search))
      )
    }

    // Sort products
    return products.sort((a, b) => {
      switch (sortBy()) {
        case 'price':
          return b.basePrice - a.basePrice
        case 'popularity':
          return (b.popularityScore || 0) - (a.popularityScore || 0)
        case 'margin':
          return (b.margin || 0) - (a.margin || 0)
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return a.name.localeCompare(b.name)
      }
    })
  }

  const productStats = () => {
    const products = state.products.list
    const totalProducts = products.length
    const activeProducts = products.filter(p => p.status === 'active').length
    const avgMargin = products.reduce((sum, p) => sum + (p.margin || 0), 0) / products.length
    const topPerformer = products.reduce((top, current) => 
      (current.popularityScore || 0) > (top.popularityScore || 0) ? current : top
    , products[0])

    return { totalProducts, activeProducts, avgMargin: Math.round(avgMargin), topPerformer }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  const findRecipeById = (recipeId: string): Recipe | null => {
    return state.recipes.list.find(recipe => recipe.id === recipeId) || null
  }

  const openRecipeModal = (recipeId: string) => {
    const recipe = findRecipeById(recipeId)
    if (recipe) {
      setSelectedRecipe(recipe)
      setShowRecipeModal(true)
    }
  }

  return (
    <>
      <SEO
        title="Products - BakeWind"
        description="Manage bakery products, pricing, and recipe connections"
        path="/products"
      />

      <div class={styles.container}>
        <div class={styles.header}>
          <div class={styles.headerContent}>
            <h1 class={styles.title}>Product Management</h1>
            <p class={styles.subtitle}>Manage your bakery's products and pricing</p>
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
              New Product
            </ActionButton>
          </div>
        </div>

        <div class={styles.statsRow}>
          <div class={styles.statCard}>
            <div class={styles.statValue}>{productStats().totalProducts}</div>
            <div class={styles.statLabel}>Total Products</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#10b981' }}>
              {productStats().activeProducts}
            </div>
            <div class={styles.statLabel}>Active Products</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#f59e0b' }}>
              {productStats().avgMargin}%
            </div>
            <div class={styles.statLabel}>Avg Margin</div>
          </div>
          <div class={styles.statCard}>
            <div class={styles.statValue} style={{ color: '#8b5cf6' }}>
              {productStats().topPerformer?.popularityScore || 0}
            </div>
            <div class={styles.statLabel}>Top Score</div>
          </div>
        </div>

        <div class={styles.controls}>
          <div class={styles.searchBar}>
            <input
              type="text"
              placeholder="Search products by name, description, or tags..."
              value={searchTerm()}
              onInput={(e) => setSearchTerm(e.currentTarget.value)}
              class={styles.searchInput}
            />
          </div>

          <div class={styles.filters}>
            <select
              value={selectedCategory()}
              onChange={(e) => setSelectedCategory(e.currentTarget.value as any)}
              class={styles.select}
            >
              <option value="all">All Categories</option>
              <option value="bread">🍞 Bread</option>
              <option value="pastry">🥐 Pastry</option>
              <option value="cake">🎂 Cake</option>
              <option value="cookie">🍪 Cookie</option>
              <option value="sandwich">🥪 Sandwich</option>
              <option value="beverage">☕ Beverage</option>
              <option value="seasonal">🍂 Seasonal</option>
              <option value="custom">🎨 Custom</option>
            </select>

            <select
              value={selectedStatus()}
              onChange={(e) => setSelectedStatus(e.currentTarget.value as any)}
              class={styles.select}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="seasonal">Seasonal</option>
              <option value="discontinued">Discontinued</option>
            </select>

            <select
              value={sortBy()}
              onChange={(e) => setSortBy(e.currentTarget.value as any)}
              class={styles.select}
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
              <option value="price">Sort by Price</option>
              <option value="popularity">Sort by Popularity</option>
              <option value="margin">Sort by Margin</option>
            </select>
          </div>
        </div>

        <Show
          when={!state.products.loading && filteredProducts().length > 0}
          fallback={
            <div class={styles.emptyState}>
              {state.products.loading ? 'Loading products...' : 'No products found'}
            </div>
          }
        >
          <Show when={viewMode() === 'cards'}>
            <div class={styles.productsGrid}>
              <For each={filteredProducts()}>
                {(product) => (
                  <div 
                    class={styles.productCard}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div class={styles.productHeader}>
                      <div class={styles.productIcon}>
                        {getCategoryIcon(product.category)}
                      </div>
                      
                      <div class={styles.productInfo}>
                        <h3 class={styles.productName}>{product.name}</h3>
                        <p class={styles.productCategory}>
                          {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                        </p>
                      </div>

                      <div class={styles.productStatus}>
                        <span 
                          class={styles.statusBadge}
                          style={{ 'background-color': `${getStatusColor(product.status)}20`, color: getStatusColor(product.status) }}
                        >
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    {product.description && (
                      <p class={styles.productDescription}>{product.description}</p>
                    )}

                    <div class={styles.productDetails}>
                      <div class={styles.detailItem}>
                        <span class={styles.detailIcon}>💰</span>
                        <span class={styles.detailText}>{formatCurrency(product.basePrice)}</span>
                      </div>
                      
                      {product.margin && (
                        <div class={styles.detailItem}>
                          <span class={styles.detailIcon}>📈</span>
                          <span class={styles.detailText}>{Math.round(product.margin)}% margin</span>
                        </div>
                      )}

                      {product.estimatedPrepTime && (
                        <div class={styles.detailItem}>
                          <span class={styles.detailIcon}>⏱️</span>
                          <span class={styles.detailText}>{formatTime(product.estimatedPrepTime)}</span>
                        </div>
                      )}

                      {product.popularityScore && (
                        <div class={styles.detailItem}>
                          <span class={styles.detailIcon}>⭐</span>
                          <span class={styles.detailText}>{product.popularityScore}/100</span>
                        </div>
                      )}
                    </div>

                    {product.tags && product.tags.length > 0 && (
                      <div class={styles.productTags}>
                        <For each={product.tags}>
                          {(tag) => (
                            <span class={styles.tag}>#{tag}</span>
                          )}
                        </For>
                      </div>
                    )}

                    {product.customizable && (
                      <div class={styles.customizableBadge}>
                        🎨 Customizable
                      </div>
                    )}
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={viewMode() === 'list'}>
            <div class={styles.productsTable}>
              <div class={styles.tableHeader}>
                <div class={styles.headerCell}>Product</div>
                <div class={styles.headerCell}>Category</div>
                <div class={styles.headerCell}>Status</div>
                <div class={styles.headerCell}>Price</div>
                <div class={styles.headerCell}>Margin</div>
                <div class={styles.headerCell}>Prep Time</div>
                <div class={styles.headerCell}>Popularity</div>
                <div class={styles.headerCell}>Actions</div>
              </div>
              
              <For each={filteredProducts()}>
                {(product) => (
                  <div 
                    class={styles.tableRow}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div class={styles.tableCell}>
                      <div class={styles.listProductInfo}>
                        <div class={styles.listProductIcon}>
                          {getCategoryIcon(product.category)}
                        </div>
                        <div class={styles.listProductDetails}>
                          <div class={styles.listProductName}>{product.name}</div>
                          {product.customizable && (
                            <div class={styles.listCustomizable}>🎨 Customizable</div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div class={styles.tableCell}>
                      <div class={styles.listCategory}>
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </div>
                    </div>
                    
                    <div class={styles.tableCell}>
                      <span 
                        class={styles.listStatusBadge}
                        style={{ 'background-color': `${getStatusColor(product.status)}20`, color: getStatusColor(product.status) }}
                      >
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                    </div>
                    
                    <div class={styles.tableCell}>
                      <div class={styles.listPrice}>{formatCurrency(product.basePrice)}</div>
                    </div>
                    
                    <div class={styles.tableCell}>
                      <div class={styles.listMargin}>
                        {product.margin ? `${Math.round(product.margin)}%` : '-'}
                      </div>
                    </div>
                    
                    <div class={styles.tableCell}>
                      <div class={styles.listPrepTime}>
                        {product.estimatedPrepTime ? formatTime(product.estimatedPrepTime) : '-'}
                      </div>
                    </div>
                    
                    <div class={styles.tableCell}>
                      <div class={styles.listPopularity}>
                        {product.popularityScore || '-'}
                      </div>
                    </div>
                    
                    <div class={styles.tableCell}>
                      <div class={styles.listActions}>
                        <button 
                          class={styles.listActionBtn}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProduct(product)
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>

        {/* Product Detail Modal */}
        <Show when={selectedProduct()}>
          <div class={styles.modal} onClick={() => setSelectedProduct(null)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <div class={styles.modalTitle}>
                  <div class={styles.modalIcon}>
                    {getCategoryIcon(selectedProduct()!.category)}
                  </div>
                  <div>
                    <h2>{selectedProduct()!.name}</h2>
                    <span 
                      class={styles.statusBadge}
                      style={{ 
                        'background-color': `${getStatusColor(selectedProduct()!.status)}20`, 
                        color: getStatusColor(selectedProduct()!.status) 
                      }}
                    >
                      {selectedProduct()!.status.charAt(0).toUpperCase() + selectedProduct()!.status.slice(1)}
                    </span>
                  </div>
                </div>
                <button class={styles.modalClose} onClick={() => setSelectedProduct(null)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <div class={styles.modalSections}>
                  <div class={styles.priceSection}>
                    <h3>Pricing & Costs</h3>
                    <div class={styles.priceDetails}>
                      <div class={styles.priceItem}>
                        <span class={styles.priceLabel}>Base Price:</span>
                        <span class={styles.priceValue}>{formatCurrency(selectedProduct()!.basePrice)}</span>
                      </div>
                      {selectedProduct()!.costOfGoods && (
                        <div class={styles.priceItem}>
                          <span class={styles.priceLabel}>Cost of Goods:</span>
                          <span class={styles.priceValue}>{formatCurrency(selectedProduct()!.costOfGoods)}</span>
                        </div>
                      )}
                      {selectedProduct()!.margin && (
                        <div class={styles.priceItem}>
                          <span class={styles.priceLabel}>Margin:</span>
                          <span class={styles.priceValue}>{Math.round(selectedProduct()!.margin)}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div class={styles.productionSection}>
                    <h3>Production Info</h3>
                    <div class={styles.productionDetails}>
                      {selectedProduct()!.estimatedPrepTime && (
                        <p><strong>Prep Time:</strong> {formatTime(selectedProduct()!.estimatedPrepTime)}</p>
                      )}
                      {selectedProduct()!.recipeId && (
                        <p>
                          <strong>Recipe:</strong> {selectedProduct()!.recipeName}
                          <button 
                            class={styles.recipeLink}
                            onClick={(e) => {
                              e.stopPropagation()
                              openRecipeModal(selectedProduct()!.recipeId!)
                            }}
                          >
                            View Recipe
                          </button>
                        </p>
                      )}
                      {selectedProduct()!.popularityScore && (
                        <p><strong>Popularity Score:</strong> {selectedProduct()!.popularityScore}/100</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedProduct()!.description && (
                  <div class={styles.descriptionSection}>
                    <h3>Description</h3>
                    <p class={styles.productDescriptionText}>{selectedProduct()!.description}</p>
                  </div>
                )}

                {selectedProduct()!.allergens && selectedProduct()!.allergens!.length > 0 && (
                  <div class={styles.allergensSection}>
                    <h3>Allergens</h3>
                    <div class={styles.allergensList}>
                      <For each={selectedProduct()!.allergens}>
                        {(allergen) => (
                          <span class={styles.allergenBadge}>⚠️ {allergen}</span>
                        )}
                      </For>
                    </div>
                  </div>
                )}

                {selectedProduct()!.customizable && selectedProduct()!.customizationOptions && (
                  <div class={styles.customizationSection}>
                    <h3>Customization Options</h3>
                    <div class={styles.customizationList}>
                      <For each={selectedProduct()!.customizationOptions}>
                        {(option) => (
                          <div class={styles.customizationOption}>
                            <strong>{option.name}</strong> ({option.type})
                            {option.options && (
                              <span class={styles.optionsList}>
                                : {option.options.join(', ')}
                              </span>
                            )}
                            {option.priceAdjustment && option.priceAdjustment > 0 && (
                              <span class={styles.priceAdjustment}>
                                +{formatCurrency(option.priceAdjustment)}
                              </span>
                            )}
                          </div>
                        )}
                      </For>
                    </div>
                  </div>
                )}

                <div class={styles.modalActions}>
                  <button class={styles.modalActionBtn}>Edit Product</button>
                  <Show when={selectedProduct()!.recipeId}>
                    <button 
                      class={styles.modalActionBtn}
                      onClick={() => openRecipeModal(selectedProduct()!.recipeId!)}
                    >
                      View Recipe
                    </button>
                  </Show>
                  <button class={styles.modalActionBtn}>Price History</button>
                  <button class={styles.modalActionBtn}>Production Stats</button>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Recipe Modal */}
        <Show when={showRecipeModal() && selectedRecipe()}>
          <div class={styles.modal} onClick={() => setShowRecipeModal(false)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <div class={styles.modalTitle}>
                  <div class={styles.modalIcon}>👨‍🍳</div>
                  <div>
                    <h2>{selectedRecipe()!.name}</h2>
                    <span class={styles.recipeCategory}>{selectedRecipe()!.category}</span>
                  </div>
                </div>
                <button class={styles.modalClose} onClick={() => setShowRecipeModal(false)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <div class={styles.recipeContent}>
                  <Show when={selectedRecipe()!.description}>
                    <div class={styles.recipeDescription}>
                      <p>{selectedRecipe()!.description}</p>
                    </div>
                  </Show>

                  <div class={styles.recipeDetails}>
                    <div class={styles.timeInfo}>
                      <div class={styles.timeItem}>
                        <span class={styles.timeLabel}>Prep Time:</span>
                        <span class={styles.timeValue}>{formatTime(selectedRecipe()!.prepTime)}</span>
                      </div>
                      <div class={styles.timeItem}>
                        <span class={styles.timeLabel}>Cook Time:</span>
                        <span class={styles.timeValue}>{formatTime(selectedRecipe()!.cookTime)}</span>
                      </div>
                      <div class={styles.timeItem}>
                        <span class={styles.timeLabel}>Total:</span>
                        <span class={styles.timeValue}>{formatTime(selectedRecipe()!.prepTime + selectedRecipe()!.cookTime)}</span>
                      </div>
                    </div>
                    
                    <div class={styles.yieldInfo}>
                      <span class={styles.yieldLabel}>Yield:</span>
                      <span class={styles.yieldValue}>{selectedRecipe()!.yield} {selectedRecipe()!.yieldUnit}</span>
                    </div>
                  </div>

                  <div class={styles.recipeSection}>
                    <h3>Ingredients</h3>
                    <div class={styles.ingredientsList}>
                      <For each={selectedRecipe()!.ingredients}>
                        {(ingredient) => (
                          <div class={styles.ingredientItem}>
                            <span class={styles.ingredientQuantity}>
                              {ingredient.quantity} {ingredient.unit}
                            </span>
                            <span class={styles.ingredientName}>{ingredient.ingredientName}</span>
                            <Show when={ingredient.cost}>
                              <span class={styles.ingredientCost}>
                                {formatCurrency(ingredient.cost!)}
                              </span>
                            </Show>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <div class={styles.recipeSection}>
                    <h3>Instructions</h3>
                    <div class={styles.instructionsList}>
                      <For each={selectedRecipe()!.instructions}>
                        {(instruction, index) => (
                          <div class={styles.instructionStep}>
                            <span class={styles.stepNumber}>{index() + 1}</span>
                            <span class={styles.stepText}>{instruction}</span>
                          </div>
                        )}
                      </For>
                    </div>
                  </div>

                  <Show when={selectedRecipe()!.allergens && selectedRecipe()!.allergens!.length > 0}>
                    <div class={styles.recipeSection}>
                      <h3>Allergens</h3>
                      <div class={styles.allergensList}>
                        <For each={selectedRecipe()!.allergens}>
                          {(allergen) => (
                            <span class={styles.allergenBadge}>⚠️ {allergen}</span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>

                  <Show when={selectedRecipe()!.tags && selectedRecipe()!.tags.length > 0}>
                    <div class={styles.recipeSection}>
                      <h3>Tags</h3>
                      <div class={styles.recipeTagsList}>
                        <For each={selectedRecipe()!.tags}>
                          {(tag) => (
                            <span class={styles.recipeTag}>#{tag}</span>
                          )}
                        </For>
                      </div>
                    </div>
                  </Show>
                </div>
              </div>
            </div>
          </div>
        </Show>

        {/* Add Product Modal Placeholder */}
        <Show when={showAddModal()}>
          <div class={styles.modal} onClick={() => setShowAddModal(false)}>
            <div class={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div class={styles.modalHeader}>
                <h2>Add New Product</h2>
                <button class={styles.modalClose} onClick={() => setShowAddModal(false)}>×</button>
              </div>
              
              <div class={styles.modalBody}>
                <p>Product creation form would go here...</p>
                <p>This would include fields for name, description, category, pricing, recipe connection, and customization options.</p>
              </div>
            </div>
          </div>
        </Show>
      </div>
    </>
  )
}