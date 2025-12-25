import { Component, createSignal, Show, For, createEffect } from "solid-js";

// Common components
import { Modal, ModalHeader, ModalBody, ModalFooter } from "~/components/common/Modal";
import { FormRow, FormStack } from "~/components/common/FormRow";
import { SectionTitle, ItemStack, ButtonGroup } from "~/components/common/Card";
import Alert from "~/components/common/Alert";
import Button from "../common/Button";
import TextField from "../common/TextField";
import TextArea from "../common/TextArea";
import Select from "../common/Select";
import Checkbox from "../common/Checkbox";

import styles from "./RecipeFormModal.module.css";

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
    <Modal isOpen={props.isOpen} onClose={props.onClose} size="xl">
      <ModalHeader
        title={props.mode === 'create' ? 'Create New Recipe' : 'Edit Recipe'}
        onClose={props.onClose}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody>
          <FormStack>
            <Show when={error()}>
              <Alert variant="error">{error()}</Alert>
            </Show>

            {/* Basic Information */}
            <FormStack>
              <TextField
                label="Recipe Name *"
                type="text"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="e.g., Classic Chocolate Chip Cookies"
                required
              />

              <FormRow cols={2}>
                <Select
                  label="Category *"
                  value={category()}
                  onChange={(e) => setCategory(e.currentTarget.value as RecipeCategory)}
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
                </Select>

                <TextField
                  label="Yield *"
                  type="text"
                  value={yieldValue()}
                  onInput={(e) => setYieldValue(e.currentTarget.value)}
                  placeholder="e.g., 24 cookies"
                  required
                />
              </FormRow>

              <FormRow cols={2}>
                <TextField
                  label="Prep Time (minutes) *"
                  type="number"
                  value={prepTime()}
                  onInput={(e) => setPrepTime(e.currentTarget.value)}
                  min="0"
                  required
                />

                <TextField
                  label="Cook Time (minutes) *"
                  type="number"
                  value={cookTime()}
                  onInput={(e) => setCookTime(e.currentTarget.value)}
                  min="0"
                  required
                />
              </FormRow>

              <TextField
                label="Tags (comma-separated)"
                type="text"
                value={tags()}
                onInput={(e) => setTags(e.currentTarget.value)}
                placeholder="e.g., classic, popular, beginner-friendly"
              />
            </FormStack>

            {/* Ingredients Section */}
            <FormStack>
              <SectionTitle>Ingredients *</SectionTitle>

              {/* Ingredient List */}
              <Show when={ingredients().length > 0}>
                <ItemStack>
                  <For each={ingredients()}>
                    {(ingredient, index) => (
                      <div class={styles.ingredientItem}>
                        <span class={styles.ingredientItemContent}>
                          <span class={styles.ingredientAmount}>{ingredient.amount} {ingredient.unit}</span> {ingredient.name}
                          <Show when={ingredient.notes}>
                            <span class={styles.ingredientNotes}>({ingredient.notes})</span>
                          </Show>
                        </span>
                        <Button
                          type="button"
                          onClick={() => removeIngredient(index())}
                          variant="danger"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </For>
                </ItemStack>
              </Show>

              {/* Add Ingredient Form */}
              <div class={styles.ingredientForm}>
                <TextField
                  type="text"
                  value={newIngredientName()}
                  onInput={(e) => setNewIngredientName(e.currentTarget.value)}
                  placeholder="Ingredient name"
                />
                <TextField
                  type="number"
                  step="0.01"
                  value={newIngredientAmount()}
                  onInput={(e) => setNewIngredientAmount(e.currentTarget.value)}
                  placeholder="Amount"
                />
                <TextField
                  type="text"
                  value={newIngredientUnit()}
                  onInput={(e) => setNewIngredientUnit(e.currentTarget.value)}
                  placeholder="Unit"
                />
                <TextField
                  type="text"
                  value={newIngredientNotes()}
                  onInput={(e) => setNewIngredientNotes(e.currentTarget.value)}
                  placeholder="Notes"
                />
                <Button
                  type="button"
                  onClick={addIngredient}
                  variant="primary"
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </FormStack>

            {/* Instructions Section */}
            <FormStack>
              <SectionTitle>Instructions *</SectionTitle>

              {/* Instruction List */}
              <Show when={instructions().length > 0}>
                <ItemStack>
                  <For each={instructions()}>
                    {(instruction, index) => (
                      <div class={styles.instructionItem}>
                        <span class={styles.instructionNumber}>{index() + 1}</span>
                        <span class={styles.instructionContent}>{instruction}</span>
                        <div class={styles.instructionActions}>
                          <Show when={index() > 0}>
                            <Button
                              type="button"
                              onClick={() => moveInstruction(index(), 'up')}
                              variant="secondary"
                              size="sm"
                              title="Move up"
                            >
                              ↑
                            </Button>
                          </Show>
                          <Show when={index() < instructions().length - 1}>
                            <Button
                              type="button"
                              onClick={() => moveInstruction(index(), 'down')}
                              variant="secondary"
                              size="sm"
                              title="Move down"
                            >
                              ↓
                            </Button>
                          </Show>
                          <Button
                            type="button"
                            onClick={() => removeInstruction(index())}
                            variant="danger"
                            size="sm"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    )}
                  </For>
                </ItemStack>
              </Show>

              {/* Add Instruction Form */}
              <div class={styles.addRow}>
                <div class={styles.addRowInput}>
                  <TextArea
                    value={newInstruction()}
                    onInput={(e) => setNewInstruction(e.currentTarget.value)}
                    placeholder="Enter instruction step"
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  onClick={addInstruction}
                  variant="primary"
                  size="sm"
                >
                  Add Step
                </Button>
              </div>
            </FormStack>

            {/* Nutrition Information (Optional) */}
            <FormStack>
              <Checkbox
                label="Include Nutrition Information"
                checked={includeNutrition()}
                onChange={(e) => setIncludeNutrition(e.currentTarget.checked)}
              />

              <Show when={includeNutrition()}>
                <FormRow cols={4}>
                  <TextField
                    label="Calories"
                    type="number"
                    value={calories()}
                    onInput={(e) => setCalories(e.currentTarget.value)}
                    min="0"
                  />
                  <TextField
                    label="Fat (g)"
                    type="number"
                    value={fat()}
                    onInput={(e) => setFat(e.currentTarget.value)}
                    min="0"
                  />
                  <TextField
                    label="Carbs (g)"
                    type="number"
                    value={carbs()}
                    onInput={(e) => setCarbs(e.currentTarget.value)}
                    min="0"
                  />
                  <TextField
                    label="Protein (g)"
                    type="number"
                    value={protein()}
                    onInput={(e) => setProtein(e.currentTarget.value)}
                    min="0"
                  />
                </FormRow>
              </Show>
            </FormStack>
          </FormStack>
        </ModalBody>

        <ModalFooter>
          <ButtonGroup>
            <Button
              type="button"
              onClick={props.onClose}
              disabled={loading()}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading()}
              variant="primary"
              size="sm"
            >
              {loading() ? 'Saving...' : props.mode === 'create' ? 'Create Recipe' : 'Update Recipe'}
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default RecipeFormModal;
