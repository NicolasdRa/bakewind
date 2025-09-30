import { Component, createSignal, For, Show } from "solid-js";

interface ProductionBatch {
  id: string;
  productName: string;
  quantity: number;
  unit: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'delayed';
  scheduledDate: string;
  startTime?: string;
  estimatedDuration: number; // in minutes
  assignedBaker: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

const ProductionPage: Component = () => {
  const [batches] = createSignal<ProductionBatch[]>([
    {
      id: '1',
      productName: 'Chocolate Croissants',
      quantity: 50,
      unit: 'pieces',
      status: 'scheduled',
      scheduledDate: '2024-12-01',
      estimatedDuration: 180,
      assignedBaker: 'Sarah Johnson',
      priority: 'high'
    },
    {
      id: '2',
      productName: 'Sourdough Bread',
      quantity: 20,
      unit: 'loaves',
      status: 'in_progress',
      scheduledDate: '2024-12-01',
      startTime: '06:00',
      estimatedDuration: 240,
      assignedBaker: 'Mike Chen',
      priority: 'medium'
    }
  ]);

  const [selectedDate, setSelectedDate] = createSignal(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = createSignal<string>('all');

  const filteredBatches = () => {
    let filtered = batches();

    if (selectedStatus() !== 'all') {
      filtered = filtered.filter(batch => batch.status === selectedStatus());
    }

    return filtered.filter(batch => batch.scheduledDate === selectedDate());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div class="p-6">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Production Planning</h1>
        <p class="text-gray-600">Schedule and track bakery production</p>
      </div>

      {/* Stats Cards */}
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Scheduled</h3>
          <p class="text-3xl font-bold text-blue-600">
            {batches().filter(b => b.status === 'scheduled').length}
          </p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">In Progress</h3>
          <p class="text-3xl font-bold text-yellow-600">
            {batches().filter(b => b.status === 'in_progress').length}
          </p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
          <p class="text-3xl font-bold text-green-600">
            {batches().filter(b => b.status === 'completed').length}
          </p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Delayed</h3>
          <p class="text-3xl font-bold text-red-600">
            {batches().filter(b => b.status === 'delayed').length}
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div class="mb-6 bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Production Date
            </label>
            <input
              type="date"
              value={selectedDate()}
              onChange={(e) => setSelectedDate(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div class="flex-1 min-w-64">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={selectedStatus()}
              onChange={(e) => setSelectedStatus(e.target.value)}
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Batches</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
              Schedule Batch
            </button>
          </div>
        </div>
      </div>

      {/* Production Schedule */}
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            Production Schedule - {new Date(selectedDate()).toLocaleDateString()}
          </h2>
        </div>

        <Show
          when={filteredBatches().length > 0}
          fallback={
            <div class="p-6 text-center text-gray-500">
              No production batches scheduled for this date.
            </div>
          }
        >
          <div class="divide-y divide-gray-200">
            <For each={filteredBatches()}>
              {(batch) => (
                <div class="p-6 hover:bg-gray-50">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3 mb-2">
                        <h3 class="text-lg font-medium text-gray-900">{batch.productName}</h3>
                        <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                          {batch.status.charAt(0).toUpperCase() + batch.status.slice(1).replace('_', ' ')}
                        </span>
                        <span class={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(batch.priority)}`}>
                          {batch.priority.charAt(0).toUpperCase() + batch.priority.slice(1)} Priority
                        </span>
                      </div>

                      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span class="font-medium">Quantity:</span> {batch.quantity} {batch.unit}
                        </div>
                        <div>
                          <span class="font-medium">Duration:</span> {formatDuration(batch.estimatedDuration)}
                        </div>
                        <div>
                          <span class="font-medium">Baker:</span> {batch.assignedBaker}
                        </div>
                        <Show when={batch.startTime}>
                          <div>
                            <span class="font-medium">Start Time:</span> {batch.startTime}
                          </div>
                        </Show>
                      </div>

                      <Show when={batch.notes}>
                        <div class="mt-2 text-sm text-gray-600">
                          <span class="font-medium">Notes:</span> {batch.notes}
                        </div>
                      </Show>
                    </div>

                    <div class="flex space-x-2 ml-4">
                      <Show when={batch.status === 'scheduled'}>
                        <button class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                          Start
                        </button>
                      </Show>
                      <Show when={batch.status === 'in_progress'}>
                        <button class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                          Complete
                        </button>
                      </Show>
                      <button class="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50">
                        Edit
                      </button>
                      <button class="px-3 py-1 text-sm text-red-600 hover:text-red-800">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Quick Recipe Reference */}
      <div class="mt-6 bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Quick Recipe Reference</h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 border border-gray-200 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">Chocolate Croissants</h4>
              <p class="text-sm text-gray-600">Time: 3h | Difficulty: Hard | Yield: 24 pieces</p>
              <button class="mt-2 text-sm text-primary-600 hover:text-primary-800">View Recipe</button>
            </div>
            <div class="p-4 border border-gray-200 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">Sourdough Bread</h4>
              <p class="text-sm text-gray-600">Time: 4h | Difficulty: Medium | Yield: 4 loaves</p>
              <button class="mt-2 text-sm text-primary-600 hover:text-primary-800">View Recipe</button>
            </div>
            <div class="p-4 border border-gray-200 rounded-lg">
              <h4 class="font-medium text-gray-900 mb-2">Vanilla Cupcakes</h4>
              <p class="text-sm text-gray-600">Time: 1.5h | Difficulty: Easy | Yield: 24 pieces</p>
              <button class="mt-2 text-sm text-primary-600 hover:text-primary-800">View Recipe</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionPage;