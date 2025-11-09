import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { recipes, recipeIngredients, inventoryItems } from '../schemas';
import * as schema from '../schemas';

export async function seedRecipes(db: NodePgDatabase<typeof schema>) {
  console.log('🌱 Seeding recipes...');

  // First, get inventory items to reference as ingredients
  const inventory = await db.select().from(inventoryItems);

  // Create a map for easy lookup
  const getInventoryId = (name: string) => {
    const item = inventory.find((i) => i.name === name);
    if (!item) {
      console.warn(`⚠️  Inventory item not found: ${name}`);
      return null;
    }
    return item.id;
  };

  // Create recipes
  const recipeList = await db
    .insert(recipes)
    .values([
      // ========== BREAD RECIPES ==========
      {
        name: 'Classic Sourdough Bread',
        category: 'bread',
        description:
          'Traditional artisan sourdough with a crispy crust and tangy flavor',
        prepTime: 240, // 4 hours (including fermentation)
        cookTime: 45,
        yield: 2,
        yieldUnit: 'loaves',
        costPerUnit: '1.8750', // Will be recalculated
        sellingPrice: '6.99',
        instructions: [
          'Mix flour, water, and sourdough starter until combined',
          'Autolyse for 30 minutes',
          'Add salt and knead for 10 minutes',
          'Bulk fermentation for 3-4 hours with folds every 30 minutes',
          'Shape into loaves and proof for 2 hours',
          'Score the top and bake at 230°C for 45 minutes',
        ],
        nutritionalInfo: {
          calories: 250,
          protein: 8,
          carbs: 52,
          fat: 1,
          sugar: 1,
          sodium: 450,
        },
        allergens: ['gluten'],
        tags: ['artisan', 'popular', 'signature'],
        isActive: true,
      },
      {
        name: 'French Baguette',
        category: 'bread',
        description: 'Crispy French baguette with airy crumb',
        prepTime: 180,
        cookTime: 25,
        yield: 3,
        yieldUnit: 'baguettes',
        costPerUnit: '0.8333',
        sellingPrice: '3.49',
        instructions: [
          'Mix bread flour, water, yeast, and salt',
          'Knead for 15 minutes until smooth',
          'First rise for 1 hour',
          'Divide and shape into baguettes',
          'Second rise for 45 minutes',
          'Score and bake at 240°C for 25 minutes',
        ],
        nutritionalInfo: {
          calories: 230,
          protein: 7,
          carbs: 48,
          fat: 1,
        },
        allergens: ['gluten'],
        tags: ['classic', 'french'],
        isActive: true,
      },
      {
        name: 'Whole Wheat Sandwich Bread',
        category: 'bread',
        description: 'Hearty whole wheat bread perfect for sandwiches',
        prepTime: 150,
        cookTime: 35,
        yield: 1,
        yieldUnit: 'loaf',
        costPerUnit: '2.1500',
        sellingPrice: '5.99',
        instructions: [
          'Mix whole wheat flour, water, honey, yeast, and salt',
          'Knead for 10 minutes',
          'First rise for 1.5 hours',
          'Shape into loaf pan',
          'Second rise for 45 minutes',
          'Bake at 190°C for 35 minutes',
        ],
        nutritionalInfo: {
          calories: 220,
          protein: 9,
          carbs: 42,
          fat: 2,
          sugar: 3,
        },
        allergens: ['gluten'],
        tags: ['healthy', 'sandwich'],
        isActive: true,
      },

      // ========== PASTRY RECIPES ==========
      {
        name: 'Butter Croissants',
        category: 'pastry',
        description: 'Flaky, buttery French croissants',
        prepTime: 420, // 7 hours (with resting time)
        cookTime: 20,
        yield: 12,
        yieldUnit: 'pieces',
        costPerUnit: '0.4583',
        sellingPrice: '2.99',
        instructions: [
          'Make dough with flour, milk, yeast, sugar, and salt',
          'Laminate with butter through 3 folds',
          'Rest in fridge between each fold (1 hour each)',
          'Roll out and cut into triangles',
          'Shape into croissants and proof for 2 hours',
          'Egg wash and bake at 200°C for 20 minutes',
        ],
        nutritionalInfo: {
          calories: 280,
          protein: 5,
          carbs: 28,
          fat: 16,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['premium', 'popular', 'french'],
        isActive: true,
      },
      {
        name: 'Chocolate Chip Cookies',
        category: 'cookie',
        description: 'Classic chocolate chip cookies with a crispy edge and chewy center',
        prepTime: 15,
        cookTime: 12,
        yield: 24,
        yieldUnit: 'cookies',
        costPerUnit: '0.2917',
        sellingPrice: '1.49',
        instructions: [
          'Cream butter and sugars until fluffy',
          'Beat in eggs and vanilla extract',
          'Mix in flour, baking soda, and salt',
          'Fold in chocolate chips',
          'Scoop onto baking sheets',
          'Bake at 180°C for 12 minutes',
        ],
        nutritionalInfo: {
          calories: 180,
          protein: 2,
          carbs: 24,
          fat: 9,
          sugar: 15,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['classic', 'popular', 'kids'],
        isActive: true,
      },

      // ========== CAKE RECIPES ==========
      {
        name: 'Classic Vanilla Cake',
        category: 'cake',
        description: 'Moist vanilla layer cake perfect for celebrations',
        prepTime: 30,
        cookTime: 35,
        yield: 1,
        yieldUnit: '9-inch cake',
        costPerUnit: '8.7500',
        sellingPrice: '35.00',
        instructions: [
          'Cream butter and sugar until light and fluffy',
          'Add eggs one at a time, beating well',
          'Mix in vanilla extract',
          'Alternate adding flour mixture and milk',
          'Pour into prepared pans',
          'Bake at 175°C for 35 minutes',
          'Cool completely before frosting',
        ],
        nutritionalInfo: {
          calories: 380,
          protein: 5,
          carbs: 52,
          fat: 18,
          sugar: 32,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['celebration', 'custom'],
        isActive: true,
      },
      {
        name: 'Dark Chocolate Cake',
        category: 'cake',
        description: 'Rich, decadent chocolate cake with deep cocoa flavor',
        prepTime: 40,
        cookTime: 40,
        yield: 1,
        yieldUnit: '9-inch cake',
        costPerUnit: '10.2500',
        sellingPrice: '42.00',
        instructions: [
          'Mix flour, cocoa powder, baking soda, and salt',
          'Cream butter and sugar',
          'Add eggs, vanilla, and coffee',
          'Alternate dry ingredients with buttermilk',
          'Pour into prepared pans',
          'Bake at 175°C for 40 minutes',
          'Cool and frost with chocolate ganache',
        ],
        nutritionalInfo: {
          calories: 420,
          protein: 6,
          carbs: 58,
          fat: 20,
          sugar: 38,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['premium', 'celebration', 'chocolate'],
        isActive: true,
      },

      // ========== SPECIALTY ITEMS ==========
      {
        name: 'Cinnamon Rolls',
        category: 'pastry',
        description: 'Soft, fluffy cinnamon rolls with cream cheese frosting',
        prepTime: 180,
        cookTime: 25,
        yield: 12,
        yieldUnit: 'rolls',
        costPerUnit: '0.5417',
        sellingPrice: '3.99',
        instructions: [
          'Make enriched dough with flour, milk, butter, eggs, and yeast',
          'First rise for 1 hour',
          'Roll out and spread with cinnamon-butter mixture',
          'Roll up and cut into 12 pieces',
          'Second rise for 45 minutes',
          'Bake at 180°C for 25 minutes',
          'Top with cream cheese frosting while warm',
        ],
        nutritionalInfo: {
          calories: 340,
          protein: 5,
          carbs: 48,
          fat: 14,
          sugar: 22,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['popular', 'breakfast', 'sweet'],
        isActive: true,
      },
      {
        name: 'Pain au Chocolat',
        category: 'pastry',
        description: 'Buttery croissant dough wrapped around dark chocolate batons',
        prepTime: 420,
        cookTime: 18,
        yield: 12,
        yieldUnit: 'pieces',
        costPerUnit: '0.6250',
        sellingPrice: '3.25',
        instructions: [
          'Prepare laminated croissant dough with butter layers',
          'Roll out dough and cut into rectangles',
          'Place chocolate batons on each rectangle',
          'Roll tightly and seal edges',
          'Proof for 2 hours at room temperature',
          'Egg wash and bake at 200°C for 18 minutes',
        ],
        nutritionalInfo: {
          calories: 310,
          protein: 6,
          carbs: 35,
          fat: 18,
          sugar: 12,
        },
        allergens: ['gluten', 'dairy', 'eggs', 'soy'],
        tags: ['french', 'chocolate', 'premium'],
        isActive: true,
      },
      {
        name: 'Blueberry Muffins',
        category: 'pastry',
        description: 'Moist muffins bursting with fresh blueberries and streusel topping',
        prepTime: 20,
        cookTime: 22,
        yield: 12,
        yieldUnit: 'muffins',
        costPerUnit: '0.4583',
        sellingPrice: '2.75',
        instructions: [
          'Mix dry ingredients: flour, sugar, baking powder, salt',
          'Combine wet ingredients: eggs, milk, melted butter, vanilla',
          'Fold wet into dry ingredients until just combined',
          'Gently fold in fresh blueberries',
          'Fill muffin tins 3/4 full',
          'Top with streusel mixture',
          'Bake at 190°C for 22 minutes until golden',
        ],
        nutritionalInfo: {
          calories: 240,
          protein: 4,
          carbs: 38,
          fat: 8,
          sugar: 18,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['breakfast', 'fruit', 'popular'],
        isActive: true,
      },
      {
        name: 'Carrot Cake',
        category: 'cake',
        description: 'Spiced carrot cake with cream cheese frosting and walnuts',
        prepTime: 45,
        cookTime: 50,
        yield: 1,
        yieldUnit: '9-inch cake',
        costPerUnit: '12.5000',
        sellingPrice: '48.00',
        instructions: [
          'Mix flour, baking soda, cinnamon, nutmeg, and salt',
          'Beat eggs with oil and sugars until smooth',
          'Fold in grated carrots, crushed pineapple, and walnuts',
          'Combine wet and dry ingredients',
          'Pour into prepared pans',
          'Bake at 175°C for 50 minutes',
          'Cool completely before frosting with cream cheese frosting',
        ],
        nutritionalInfo: {
          calories: 410,
          protein: 5,
          carbs: 52,
          fat: 21,
          sugar: 35,
        },
        allergens: ['gluten', 'dairy', 'eggs', 'nuts'],
        tags: ['celebration', 'signature', 'spiced'],
        isActive: true,
      },
      {
        name: 'Lemon Tart',
        category: 'pastry',
        description: 'Tangy lemon curd in a buttery shortbread crust',
        prepTime: 60,
        cookTime: 35,
        yield: 8,
        yieldUnit: 'slices',
        costPerUnit: '1.8750',
        sellingPrice: '6.50',
        instructions: [
          'Make shortbread crust with butter, sugar, and flour',
          'Press into tart pan and blind bake at 180°C for 15 minutes',
          'Prepare lemon curd with lemon juice, zest, eggs, sugar, and butter',
          'Cook curd over double boiler until thick',
          'Pour into baked crust',
          'Bake for 20 minutes until just set',
          'Chill completely before slicing',
        ],
        nutritionalInfo: {
          calories: 320,
          protein: 4,
          carbs: 42,
          fat: 16,
          sugar: 28,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['french', 'citrus', 'elegant'],
        isActive: true,
      },
      {
        name: 'Banana Bread',
        category: 'bread',
        description: 'Moist banana bread with optional chocolate chips or walnuts',
        prepTime: 15,
        cookTime: 60,
        yield: 1,
        yieldUnit: 'loaf',
        costPerUnit: '2.2500',
        sellingPrice: '7.99',
        instructions: [
          'Mash ripe bananas until smooth',
          'Mix in melted butter, sugar, egg, and vanilla',
          'Combine flour, baking soda, and salt',
          'Fold dry ingredients into banana mixture',
          'Optional: add chocolate chips or walnuts',
          'Pour into greased loaf pan',
          'Bake at 175°C for 60 minutes until toothpick comes out clean',
        ],
        nutritionalInfo: {
          calories: 280,
          protein: 4,
          carbs: 45,
          fat: 10,
          sugar: 24,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['quick bread', 'banana', 'comfort'],
        isActive: true,
      },
      {
        name: 'Macaron Assortment',
        category: 'cookie',
        description: 'Delicate French macarons in assorted flavors',
        prepTime: 90,
        cookTime: 15,
        yield: 24,
        yieldUnit: 'macarons',
        costPerUnit: '0.7917',
        sellingPrice: '2.50',
        instructions: [
          'Sift almond flour and powdered sugar together three times',
          'Make French meringue with egg whites and granulated sugar',
          'Fold dry ingredients into meringue using macaronage technique',
          'Pipe circles onto parchment-lined baking sheets',
          'Let dry for 30 minutes until skin forms',
          'Bake at 150°C for 15 minutes',
          'Cool completely before filling with buttercream or ganache',
        ],
        nutritionalInfo: {
          calories: 110,
          protein: 2,
          carbs: 14,
          fat: 5,
          sugar: 12,
        },
        allergens: ['eggs', 'nuts', 'dairy'],
        tags: ['french', 'premium', 'elegant', 'gluten-free'],
        isActive: true,
      },
      {
        name: 'Brownies',
        category: 'cookie',
        description: 'Fudgy chocolate brownies with a crackly top',
        prepTime: 20,
        cookTime: 30,
        yield: 16,
        yieldUnit: 'brownies',
        costPerUnit: '0.4375',
        sellingPrice: '2.50',
        instructions: [
          'Melt butter and dark chocolate together',
          'Whisk in sugar, eggs, and vanilla until smooth',
          'Fold in flour, cocoa powder, and salt',
          'Pour into greased 9x13 pan',
          'Optional: swirl in peanut butter or add chocolate chips',
          'Bake at 175°C for 30 minutes',
          'Cool completely before cutting',
        ],
        nutritionalInfo: {
          calories: 220,
          protein: 3,
          carbs: 28,
          fat: 12,
          sugar: 20,
        },
        allergens: ['gluten', 'dairy', 'eggs', 'soy'],
        tags: ['chocolate', 'fudgy', 'popular'],
        isActive: true,
      },
      {
        name: 'Focaccia',
        category: 'bread',
        description: 'Italian flatbread with herbs, olive oil, and sea salt',
        prepTime: 150,
        cookTime: 25,
        yield: 1,
        yieldUnit: 'sheet',
        costPerUnit: '2.8000',
        sellingPrice: '8.99',
        instructions: [
          'Mix bread flour, water, yeast, olive oil, and salt',
          'Knead until smooth and elastic',
          'First rise for 1 hour',
          'Stretch dough in oiled baking sheet',
          'Dimple surface with fingers',
          'Drizzle with olive oil, add rosemary and sea salt',
          'Second rise for 30 minutes',
          'Bake at 220°C for 25 minutes until golden',
        ],
        nutritionalInfo: {
          calories: 210,
          protein: 6,
          carbs: 35,
          fat: 6,
          sugar: 1,
        },
        allergens: ['gluten'],
        tags: ['italian', 'artisan', 'savory'],
        isActive: true,
      },
      {
        name: 'Apple Pie',
        category: 'pastry',
        description: 'Classic double-crust apple pie with cinnamon and brown sugar',
        prepTime: 60,
        cookTime: 55,
        yield: 8,
        yieldUnit: 'slices',
        costPerUnit: '2.2500',
        sellingPrice: '7.99',
        instructions: [
          'Make pie dough with flour, butter, salt, and ice water',
          'Chill dough for 30 minutes',
          'Peel and slice apples, toss with sugar, cinnamon, and lemon juice',
          'Roll out bottom crust and place in pie dish',
          'Fill with apple mixture and dot with butter',
          'Cover with top crust, crimp edges, and cut vents',
          'Brush with egg wash and sprinkle with sugar',
          'Bake at 190°C for 55 minutes until golden and bubbling',
        ],
        nutritionalInfo: {
          calories: 340,
          protein: 3,
          carbs: 52,
          fat: 14,
          sugar: 28,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['classic', 'fruit', 'american'],
        isActive: true,
      },
      {
        name: 'Eclair',
        category: 'pastry',
        description: 'Choux pastry filled with vanilla cream and topped with chocolate',
        prepTime: 90,
        cookTime: 35,
        yield: 12,
        yieldUnit: 'eclairs',
        costPerUnit: '0.7083',
        sellingPrice: '3.75',
        instructions: [
          'Make choux pastry with water, butter, flour, and eggs',
          'Pipe 4-inch logs onto baking sheet',
          'Bake at 200°C for 30 minutes until puffed and golden',
          'Cool completely',
          'Make vanilla pastry cream',
          'Fill eclairs with cream using piping bag',
          'Dip tops in chocolate ganache',
          'Refrigerate until serving',
        ],
        nutritionalInfo: {
          calories: 285,
          protein: 5,
          carbs: 32,
          fat: 15,
          sugar: 18,
        },
        allergens: ['gluten', 'dairy', 'eggs', 'soy'],
        tags: ['french', 'elegant', 'cream'],
        isActive: true,
      },
      {
        name: 'Tiramisu',
        category: 'cake',
        description: 'Italian coffee-flavored dessert with mascarpone cream',
        prepTime: 45,
        cookTime: 0,
        yield: 12,
        yieldUnit: 'servings',
        costPerUnit: '1.9167',
        sellingPrice: '6.99',
        instructions: [
          'Brew strong espresso and let cool',
          'Whisk egg yolks with sugar until thick',
          'Fold in mascarpone cheese',
          'Whip heavy cream to stiff peaks',
          'Fold whipped cream into mascarpone mixture',
          'Dip ladyfinger cookies in espresso',
          'Layer cookies and cream in dish',
          'Dust with cocoa powder and refrigerate overnight',
        ],
        nutritionalInfo: {
          calories: 380,
          protein: 7,
          carbs: 35,
          fat: 24,
          sugar: 22,
        },
        allergens: ['gluten', 'dairy', 'eggs'],
        tags: ['italian', 'coffee', 'no-bake', 'premium'],
        isActive: true,
      },
    ])
    .returning();

  console.log(`✅ Created ${recipeList.length} recipes`);

  // Create recipe ingredients
  const ingredientsData: Array<{
    recipeId: string;
    ingredientId: string | null;
    ingredientName: string;
    quantity: string;
    unit: string;
    cost: string;
    notes: string | null;
  }> = [];

  // Sourdough Bread ingredients
  if (recipeList[0]) {
    ingredientsData.push(
      {
        recipeId: recipeList[0].id,
        ingredientId: getInventoryId('Bread Flour'),
        ingredientName: 'Bread Flour',
        quantity: '500',
        unit: 'g',
        cost: '0.7250', // 0.5kg * 1.45
        notes: 'High protein for structure',
      },
      {
        recipeId: recipeList[0].id,
        ingredientId: getInventoryId('Water'),
        ingredientName: 'Water',
        quantity: '350',
        unit: 'ml',
        cost: '0.0035', // negligible
        notes: 'Filtered water',
      },
      {
        recipeId: recipeList[0].id,
        ingredientId: getInventoryId('Active Dry Yeast'),
        ingredientName: 'Sourdough Starter',
        quantity: '150',
        unit: 'g',
        cost: '0.3000',
        notes: 'Active sourdough starter',
      },
      {
        recipeId: recipeList[0].id,
        ingredientId: getInventoryId('Fine Sea Salt'),
        ingredientName: 'Fine Sea Salt',
        quantity: '12',
        unit: 'g',
        cost: '0.0360', // 0.012kg * 3.00
        notes: null,
      },
    );
  }

  // Baguette ingredients
  if (recipeList[1]) {
    ingredientsData.push(
      {
        recipeId: recipeList[1].id,
        ingredientId: getInventoryId('Bread Flour'),
        ingredientName: 'Bread Flour',
        quantity: '600',
        unit: 'g',
        cost: '0.8700',
        notes: null,
      },
      {
        recipeId: recipeList[1].id,
        ingredientId: getInventoryId('Water'),
        ingredientName: 'Water',
        quantity: '400',
        unit: 'ml',
        cost: '0.0040',
        notes: null,
      },
      {
        recipeId: recipeList[1].id,
        ingredientId: getInventoryId('Active Dry Yeast'),
        ingredientName: 'Active Dry Yeast',
        quantity: '8',
        unit: 'g',
        cost: '0.1920',
        notes: null,
      },
      {
        recipeId: recipeList[1].id,
        ingredientId: getInventoryId('Fine Sea Salt'),
        ingredientName: 'Fine Sea Salt',
        quantity: '14',
        unit: 'g',
        cost: '0.0420',
        notes: null,
      },
    );
  }

  // Chocolate Chip Cookies ingredients
  if (recipeList[4]) {
    ingredientsData.push(
      {
        recipeId: recipeList[4].id,
        ingredientId: getInventoryId('All-Purpose Flour'),
        ingredientName: 'All-Purpose Flour',
        quantity: '300',
        unit: 'g',
        cost: '0.3750',
        notes: null,
      },
      {
        recipeId: recipeList[4].id,
        ingredientId: getInventoryId('Unsalted Butter'),
        ingredientName: 'Unsalted Butter',
        quantity: '200',
        unit: 'g',
        cost: '1.8000',
        notes: 'Room temperature',
      },
      {
        recipeId: recipeList[4].id,
        ingredientId: getInventoryId('Granulated Sugar'),
        ingredientName: 'Granulated Sugar',
        quantity: '150',
        unit: 'g',
        cost: '0.2250',
        notes: null,
      },
      {
        recipeId: recipeList[4].id,
        ingredientId: getInventoryId('Brown Sugar'),
        ingredientName: 'Brown Sugar',
        quantity: '150',
        unit: 'g',
        cost: '0.2550',
        notes: 'Packed',
      },
      {
        recipeId: recipeList[4].id,
        ingredientId: getInventoryId('Large Eggs'),
        ingredientName: 'Large Eggs',
        quantity: '2',
        unit: 'unit',
        cost: '1.0000',
        notes: null,
      },
      {
        recipeId: recipeList[4].id,
        ingredientId: getInventoryId('Vanilla Extract'),
        ingredientName: 'Vanilla Extract',
        quantity: '5',
        unit: 'ml',
        cost: '0.7500',
        notes: 'Pure vanilla',
      },
      {
        recipeId: recipeList[4].id,
        ingredientId: getInventoryId('Dark Chocolate Chips'),
        ingredientName: 'Dark Chocolate Chips',
        quantity: '300',
        unit: 'g',
        cost: '2.5500',
        notes: '60% cocoa',
      },
    );
  }

  // Filter out any null ingredient IDs and insert
  const validIngredients = ingredientsData.filter(
    (ing): ing is typeof ing & { ingredientId: string } => ing.ingredientId !== null
  );

  if (validIngredients.length > 0) {
    await db.insert(recipeIngredients).values(validIngredients);
    console.log(`✅ Created ${validIngredients.length} recipe ingredients`);
  }

  console.log('🌱 Recipes seeding complete!');
}
