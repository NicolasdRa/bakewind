import { Component, createSignal, Show, For, createEffect } from "solid-js";

type RecipeCategory = 'bread' | 'pastry' | 'cake' | 'cookie' | 'sandwich' | 'beverage' | 'sauce' | 'filling' | 'topping' | 'other';

interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  yield: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  tags: string[];
  nutritionalInfo?: {
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  recipe?: Recipe;
  mode: 'create' | 'edit';
}

const RecipeFormModal: Component<RecipeFormModalProps> = (props) => {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  // Basic fields
  const [name, setName] = createSignal('');
  const [category, setCategory] = createSignal<RecipeCategory>('bread');
  const [prepTime, setPrepTime] = createSignal('');
  const [cookTime, setCookTime] = createSignal('');
  const [yieldValue, setYieldValue] = createSignal('');
  const [tags, setTags] = createSignal('');

  // Ingredients
  const [ingredients, setIngredients] = createSignal<RecipeIngredient[]>([]);
  const [newIngredientName, setNewIngredientName] = createSignal('');
  const [newIngredientAmount, setNewIngredientAmount] = createSignal('');
  const [newIngredientUnit, setNewIngredientUnit] = createSignal('');
  const [newIngredientNotes, setNewIngredientNotes] = createSignal('');

  // Instructions
  const [instructions, setInstructions] = createSignal<string[]>([]);
  const [newInstruction, setNewInstruction] = createSignal('');

  // Nutrition
  const [includeNutrition, setIncludeNutrition] = createSignal(false);
  const [calories, setCalories] = createSignal('');
  const [fat, setFat] = createSignal('');
  const [carbs, setCarbs] = createSignal('');
  const [protein, setProtein] = createSignal('');

  // Populate form when recipe changes (for edit mode)
  createEffect(() => {
    if (props.isOpen && props.recipe && props.mode === 'edit') {
      setName(props.recipe.name);
      setCategory(props.recipe.category);
      setPrepTime(props.recipe.prepTime.toString());
      setCookTime(props.recipe.cookTime.toString());
      setYieldValue(props.recipe.yield);
      setTags(props.recipe.tags.join(', '));
      setIngredients([...props.recipe.ingredients]);
      setInstructions([...props.recipe.instructions]);

      if (props.recipe.nutritionalInfo) {
        setIncludeNutrition(true);
        setCalories(props.recipe.nutritionalInfo.calories?.toString() || '');
        setFat(props.recipe.nutritionalInfo.fat?.toString() || '');
        setCarbs(props.recipe.nutritionalInfo.carbs?.toString() || '');
        setProtein(props.recipe.nutritionalInfo.protein?.toString() || '');
      } else {
        setIncludeNutrition(false);
      }
    } else if (props.isOpen && props.mode === 'create') {
      // Reset form for create mode
      setName('');
      setCategory('bread');
      setPrepTime('');
      setCookTime('');
      setYieldValue('');
      setTags('');
      setIngredients([]);
      setInstructions([]);
      setIncludeNutrition(false);
      setCalories('');
      setFat('');
      setCarbs('');
      setProtein('');
    }
  });

  const addIngredient = () => {
    const ingredient = newIngredientName().trim();
    const amount = parseFloat(newIngredientAmount());
    const unit = newIngredientUnit().trim();

    if (!ingredient || !amount || !unit) {
      setError('Please fill in ingredient name, amount, and unit');
      return;
    }

    setIngredients([...ingredients(), {
      name: ingredient,
      amount,
      unit,
      notes: newIngredientNotes().trim() || undefined,
    }]);

    setNewIngredientName('');
    setNewIngredientAmount('');
    setNewIngredientUnit('');
    setNewIngredientNotes('');
    setError(null);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients().filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    const instruction = newInstruction().trim();
    if (!instruction) return;

    setInstructions([...instructions(), instruction]);
    setNewInstruction('');
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions().filter((_, i) => i !== index));
  };

  const moveInstruction = (index: number, direction: 'up' | 'down') => {
    const newInstructions = [...instructions()];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newInstructions.length) return;

    [newInstructions[index], newInstructions[newIndex]] = [newInstructions[newIndex], newInstructions[index]];
    setInstructions(newInstructions);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name().trim()) {
      setError('Recipe name is required');
      return;
    }

    if (ingredients().length === 0) {
      setError('At least one ingredient is required');
      return;
    }

    if (instructions().length === 0) {
      setError('At least one instruction is required');
      return;
    }

    setLoading(true);

    try {
      const prepTimeNum = parseInt(prepTime());
      const cookTimeNum = parseInt(cookTime());

      const data: any = {
        name: name().trim(),
        category: category(),
        prepTime: prepTimeNum,
        cookTime: cookTimeNum,
        totalTime: prepTimeNum + cookTimeNum,
        yield: yieldValue().trim(),
        ingredients: ingredients(),
        instructions: instructions(),
        tags: tags() ? tags().split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      if (includeNutrition() && calories() && fat() && carbs() && protein()) {
        data.nutritionInfo = {
          calories: parseInt(calories()),
          fat: parseInt(fat()),
          carbs: parseInt(carbs()),
          protein: parseInt(protein()),
        };
      }

      await props.onSubmit(data);
      props.onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ "background-color": "rgba(0, 0, 0, 0.5)" }}
        onClick={props.onClose}
      >
        <div
          class="rounded-xl border shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
          style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="p-6 border-b" style={{ "border-color": "var(--border-color)" }}>
            <h2 class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {props.mode === 'create' ? 'Create New Recipe' : 'Edit Recipe'}
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div class="p-6 space-y-6">
              <Show when={error()}>
                <div class="p-4 rounded-lg" style={{ "background-color": "var(--error-light)", "border": "1px solid var(--error-color)" }}>
                  <p class="text-sm" style={{ color: "var(--error-color)" }}>{error()}</p>
                </div>
              </Show>

              {/* Basic Information */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Recipe Name *
                  </label>
                  <input
                    type="text"
                    value={name()}
                    onInput={(e) => setName(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-secondary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                    placeholder="e.g., Classic Chocolate Chip Cookies"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Category *
                  </label>
                  <select
                    value={category()}
                    onChange={(e) => setCategory(e.currentTarget.value as RecipeCategory)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-secondary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                  >
                    <option value="bread">Bread</option>
                    <option value="pastry">Pastry</option>
                    <option value="cake">Cake</option>
                    <option value="cookie">Cookie</option>
                    <option value="sandwich">Sandwich</option>
                    <option value="beverage">Beverage</option>
                    <option value="sauce">Sauce</option>
                    <option value="filling">Filling</option>
                    <option value="topping">Topping</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Prep Time (minutes) *
                  </label>
                  <input
                    type="number"
                    value={prepTime()}
                    onInput={(e) => setPrepTime(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-secondary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Cook Time (minutes) *
                  </label>
                  <input
                    type="number"
                    value={cookTime()}
                    onInput={(e) => setCookTime(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-secondary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Yield *
                  </label>
                  <input
                    type="text"
                    value={yieldValue()}
                    onInput={(e) => setYieldValue(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-secondary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                    placeholder="e.g., 24 cookies"
                    required
                  />
                </div>

                <div class="md:col-span-2">
                  <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags()}
                    onInput={(e) => setTags(e.currentTarget.value)}
                    class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-secondary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                    placeholder="e.g., classic, popular, beginner-friendly"
                  />
                </div>
              </div>

              {/* Ingredients Section */}
              <div class="border-t pt-6" style={{ "border-color": "var(--border-color)" }}>
                <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Ingredients *
                </h3>

                {/* Ingredient List */}
                <Show when={ingredients().length > 0}>
                  <div class="mb-4 space-y-2">
                    <For each={ingredients()}>
                      {(ingredient, index) => (
                        <div class="flex items-center gap-3 p-3 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                          <span class="flex-1" style={{ color: "var(--text-primary)" }}>
                            <span class="font-medium">{ingredient.amount} {ingredient.unit}</span> {ingredient.name}
                            <Show when={ingredient.notes}>
                              <span class="text-sm italic ml-1" style={{ color: "var(--text-tertiary)" }}>
                                ({ingredient.notes})
                              </span>
                            </Show>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeIngredient(index())}
                            class="px-3 py-1 text-sm rounded-lg transition-colors"
                            style={{ color: "var(--error-color)" }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>

                {/* Add Ingredient Form */}
                <div class="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div class="md:col-span-2">
                    <input
                      type="text"
                      value={newIngredientName()}
                      onInput={(e) => setNewIngredientName(e.currentTarget.value)}
                      class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                      style={{
                        "background-color": "var(--bg-secondary)",
                        "border-color": "var(--border-color)",
                        "color": "var(--text-primary)",
                        "--tw-ring-color": "var(--primary-color)"
                      }}
                      placeholder="Ingredient name"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      value={newIngredientAmount()}
                      onInput={(e) => setNewIngredientAmount(e.currentTarget.value)}
                      class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                      style={{
                        "background-color": "var(--bg-secondary)",
                        "border-color": "var(--border-color)",
                        "color": "var(--text-primary)",
                        "--tw-ring-color": "var(--primary-color)"
                      }}
                      placeholder="Amount"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newIngredientUnit()}
                      onInput={(e) => setNewIngredientUnit(e.currentTarget.value)}
                      class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                      style={{
                        "background-color": "var(--bg-secondary)",
                        "border-color": "var(--border-color)",
                        "color": "var(--text-primary)",
                        "--tw-ring-color": "var(--primary-color)"
                      }}
                      placeholder="Unit"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newIngredientNotes()}
                      onInput={(e) => setNewIngredientNotes(e.currentTarget.value)}
                      class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                      style={{
                        "background-color": "var(--bg-secondary)",
                        "border-color": "var(--border-color)",
                        "color": "var(--text-primary)",
                        "--tw-ring-color": "var(--primary-color)"
                      }}
                      placeholder="Notes"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={addIngredient}
                      class="w-full px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                      style={{
                        "background-color": "var(--primary-color)",
                        "color": "white",
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Instructions Section */}
              <div class="border-t pt-6" style={{ "border-color": "var(--border-color)" }}>
                <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Instructions *
                </h3>

                {/* Instruction List */}
                <Show when={instructions().length > 0}>
                  <div class="mb-4 space-y-2">
                    <For each={instructions()}>
                      {(instruction, index) => (
                        <div class="flex items-start gap-3 p-3 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                          <span
                            class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                            style={{ "background-color": "var(--primary-color)", color: "white" }}
                          >
                            {index() + 1}
                          </span>
                          <span class="flex-1" style={{ color: "var(--text-primary)" }}>
                            {instruction}
                          </span>
                          <div class="flex gap-2">
                            <Show when={index() > 0}>
                              <button
                                type="button"
                                onClick={() => moveInstruction(index(), 'up')}
                                class="px-2 py-1 text-sm rounded transition-colors"
                                style={{ color: "var(--text-secondary)" }}
                                title="Move up"
                              >
                                ↑
                              </button>
                            </Show>
                            <Show when={index() < instructions().length - 1}>
                              <button
                                type="button"
                                onClick={() => moveInstruction(index(), 'down')}
                                class="px-2 py-1 text-sm rounded transition-colors"
                                style={{ color: "var(--text-secondary)" }}
                                title="Move down"
                              >
                                ↓
                              </button>
                            </Show>
                            <button
                              type="button"
                              onClick={() => removeInstruction(index())}
                              class="px-2 py-1 text-sm rounded transition-colors"
                              style={{ color: "var(--error-color)" }}
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                    </For>
                  </div>
                </Show>

                {/* Add Instruction Form */}
                <div class="flex gap-3">
                  <textarea
                    value={newInstruction()}
                    onInput={(e) => setNewInstruction(e.currentTarget.value)}
                    class="flex-1 px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                    style={{
                      "background-color": "var(--bg-secondary)",
                      "border-color": "var(--border-color)",
                      "color": "var(--text-primary)",
                      "--tw-ring-color": "var(--primary-color)"
                    }}
                    placeholder="Enter instruction step"
                    rows="2"
                  />
                  <button
                    type="button"
                    onClick={addInstruction}
                    class="px-6 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                    style={{
                      "background-color": "var(--primary-color)",
                      "color": "white",
                    }}
                  >
                    Add Step
                  </button>
                </div>
              </div>

              {/* Nutrition Information (Optional) */}
              <div class="border-t pt-6" style={{ "border-color": "var(--border-color)" }}>
                <label class="flex items-center gap-3 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeNutrition()}
                    onChange={(e) => setIncludeNutrition(e.currentTarget.checked)}
                    class="w-5 h-5 rounded"
                  />
                  <span class="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                    Include Nutrition Information
                  </span>
                </label>

                <Show when={includeNutrition()}>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                        Calories
                      </label>
                      <input
                        type="number"
                        value={calories()}
                        onInput={(e) => setCalories(e.currentTarget.value)}
                        class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{
                          "background-color": "var(--bg-secondary)",
                          "border-color": "var(--border-color)",
                          "color": "var(--text-primary)",
                          "--tw-ring-color": "var(--primary-color)"
                        }}
                        min="0"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                        Fat (g)
                      </label>
                      <input
                        type="number"
                        value={fat()}
                        onInput={(e) => setFat(e.currentTarget.value)}
                        class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{
                          "background-color": "var(--bg-secondary)",
                          "border-color": "var(--border-color)",
                          "color": "var(--text-primary)",
                          "--tw-ring-color": "var(--primary-color)"
                        }}
                        min="0"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                        Carbs (g)
                      </label>
                      <input
                        type="number"
                        value={carbs()}
                        onInput={(e) => setCarbs(e.currentTarget.value)}
                        class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{
                          "background-color": "var(--bg-secondary)",
                          "border-color": "var(--border-color)",
                          "color": "var(--text-primary)",
                          "--tw-ring-color": "var(--primary-color)"
                        }}
                        min="0"
                      />
                    </div>
                    <div>
                      <label class="block text-sm font-medium mb-2" style={{ color: "var(--text-primary)" }}>
                        Protein (g)
                      </label>
                      <input
                        type="number"
                        value={protein()}
                        onInput={(e) => setProtein(e.currentTarget.value)}
                        class="w-full px-4 py-2.5 border rounded-lg transition-all focus:outline-none focus:ring-2"
                        style={{
                          "background-color": "var(--bg-secondary)",
                          "border-color": "var(--border-color)",
                          "color": "var(--text-primary)",
                          "--tw-ring-color": "var(--primary-color)"
                        }}
                        min="0"
                      />
                    </div>
                  </div>
                </Show>
              </div>

            </div>

            {/* Footer */}
            <div class="p-6 border-t flex gap-3" style={{ "border-color": "var(--border-color)" }}>
              <button
                type="button"
                onClick={props.onClose}
                disabled={loading()}
                class="flex-1 px-5 py-2.5 rounded-lg font-medium transition-all"
                style={{
                  "background-color": "var(--bg-secondary)",
                  color: "var(--text-primary)",
                  "border": "1px solid var(--border-color)"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading()}
                class="flex-1 px-5 py-2.5 rounded-lg font-medium transition-all hover:opacity-90"
                style={{
                  "background-color": "var(--primary-color)",
                  color: "white",
                  opacity: loading() ? '0.6' : '1',
                }}
              >
                {loading() ? 'Saving...' : props.mode === 'create' ? 'Create Recipe' : 'Update Recipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
};

export default RecipeFormModal;
