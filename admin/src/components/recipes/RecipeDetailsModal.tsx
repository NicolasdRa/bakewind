import { Component, For, Show } from "solid-js";
import Button from "../common/Button";

type RecipeCategory = 'bread' | 'pastry' | 'cake' | 'cookie' | 'sandwich' | 'beverage' | 'sauce' | 'filling' | 'topping' | 'other';

interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  yield: string;
  servings?: number;
  ingredients: Array<{
    name: string;
    amount: number;
    unit: string;
    notes?: string;
  }>;
  instructions: string[];
  tags: string[];
  notes?: string;
  nutritionalInfo?: {
    calories?: number;
    fat?: number;
    carbs?: number;
    protein?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface RecipeDetailsModalProps {
  isOpen: boolean;
  recipe: Recipe | null;
  onClose: () => void;
  onEdit?: () => void;
}

const RecipeDetailsModal: Component<RecipeDetailsModalProps> = (props) => {
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Show when={props.isOpen && props.recipe}>
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ "background-color": "rgba(0, 0, 0, 0.5)" }}
        onClick={props.onClose}
      >
        <div
          class="rounded-xl border shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          style={{
            "background-color": "var(--bg-primary)",
            "border-color": "var(--border-color)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="p-6 border-b" style={{ "border-color": "var(--border-color)" }}>
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-2xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                  {props.recipe!.name}
                </h2>
                <div class="flex items-center gap-3">
                  <Show when={props.recipe!.category}>
                    <span class="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800" style={{ color: "var(--text-primary)" }}>
                      {props.recipe!.category!.charAt(0).toUpperCase() + props.recipe!.category!.slice(1)}
                    </span>
                  </Show>
                </div>
              </div>
              <Button
                onClick={props.onClose}
                variant="ghost"
                size="sm"
                class="p-2"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Content */}
          <div class="p-6 space-y-6">
            {/* Time & Yield Information */}
            <div>
              <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Overview
              </h3>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                  <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Prep Time</p>
                  <p class="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
                    {formatTime(props.recipe!.prepTime)}
                  </p>
                </div>
                <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                  <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Cook Time</p>
                  <p class="text-2xl font-bold" style={{ color: "var(--primary-color)" }}>
                    {formatTime(props.recipe!.cookTime)}
                  </p>
                </div>
                <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                  <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Total Time</p>
                  <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {formatTime(props.recipe!.totalTime)}
                  </p>
                </div>
                <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                  <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Yield</p>
                  <p class="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                    {props.recipe!.yield}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <Show when={props.recipe!.tags.length > 0}>
              <div>
                <h3 class="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  Tags
                </h3>
                <div class="flex flex-wrap gap-2">
                  <For each={props.recipe!.tags}>
                    {(tag) => (
                      <span class="inline-flex px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full" style={{ color: "var(--text-primary)" }}>
                        {tag}
                      </span>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            {/* Ingredients */}
            <div>
              <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Ingredients {props.recipe!.servings ? `(${props.recipe!.servings} servings)` : `(${props.recipe!.yield})`}
              </h3>
              <div class="p-5 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                <ul class="space-y-2.5">
                  <For each={props.recipe!.ingredients}>
                    {(ingredient) => (
                      <li class="flex items-start gap-3">
                        <span class="text-lg mt-0.5" style={{ color: "var(--primary-color)" }}>•</span>
                        <div class="flex-1">
                          <span class="font-medium" style={{ color: "var(--text-primary)" }}>
                            {ingredient.amount} {ingredient.unit}
                          </span>
                          <span class="ml-2" style={{ color: "var(--text-secondary)" }}>
                            {ingredient.name}
                          </span>
                          <Show when={ingredient.notes}>
                            <span class="ml-1 italic text-sm" style={{ color: "var(--text-tertiary)" }}>
                              ({ingredient.notes})
                            </span>
                          </Show>
                        </div>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                Instructions
              </h3>
              <div class="space-y-4">
                <For each={props.recipe!.instructions}>
                  {(instruction, index) => (
                    <div class="flex items-start gap-4">
                      <div
                        class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                        style={{
                          "background-color": "var(--primary-color)",
                          color: "white",
                        }}
                      >
                        {index() + 1}
                      </div>
                      <p class="flex-1 pt-1" style={{ color: "var(--text-secondary)" }}>
                        {instruction}
                      </p>
                    </div>
                  )}
                </For>
              </div>
            </div>

            {/* Nutrition Info */}
            <Show when={props.recipe!.nutritionalInfo}>
              <div>
                <h3 class="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
                  Nutritional Information (per serving)
                </h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Calories</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {props.recipe!.nutritionalInfo!.calories}
                    </p>
                  </div>
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Fat</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {props.recipe!.nutritionalInfo!.fat}g
                    </p>
                  </div>
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Carbs</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {props.recipe!.nutritionalInfo!.carbs}g
                    </p>
                  </div>
                  <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                    <p class="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Protein</p>
                    <p class="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                      {props.recipe!.nutritionalInfo!.protein}g
                    </p>
                  </div>
                </div>
              </div>
            </Show>

            {/* Notes */}
            <Show when={props.recipe!.notes}>
              <div>
                <h3 class="text-lg font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                  Notes
                </h3>
                <div class="p-4 rounded-lg" style={{ "background-color": "var(--bg-secondary)" }}>
                  <p style={{ color: "var(--text-secondary)" }}>
                    {props.recipe!.notes}
                  </p>
                </div>
              </div>
            </Show>

            {/* Timestamps */}
            <div class="pt-4 border-t" style={{ "border-color": "var(--border-color)" }}>
              <div class="flex justify-between text-xs" style={{ color: "var(--text-tertiary)" }}>
                <span>Created: {new Date(props.recipe!.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(props.recipe!.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div class="p-6 border-t flex gap-3" style={{ "border-color": "var(--border-color)" }}>
            <Button
              onClick={props.onClose}
              variant="secondary"
              size="sm"
              fullWidth
            >
              Close
            </Button>
            <Show when={props.onEdit}>
              <Button
                onClick={props.onEdit}
                variant="primary"
                size="sm"
                fullWidth
              >
                Edit Recipe
              </Button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default RecipeDetailsModal;
