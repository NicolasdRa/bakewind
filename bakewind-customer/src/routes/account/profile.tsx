import { Title, Meta } from "@solidjs/meta";
import { createSignal, Show } from "solid-js";
import { A } from "@solidjs/router";
import { AuthGuard } from "../../auth/AuthContext";
import "../../styles/globals.css";

// Profile form interface
interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  preferences: {
    newsletter: boolean;
    smsNotifications: boolean;
    specialOffers: boolean;
    allergens: string[];
  };
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

// Mock current user data
const mockCurrentProfile: ProfileData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "(555) 123-4567",
  dateOfBirth: "1990-05-15",
  preferences: {
    newsletter: true,
    smsNotifications: false,
    specialOffers: true,
    allergens: ["Nuts", "Dairy"],
  },
  address: {
    street: "123 Main Street",
    city: "San Francisco",
    state: "CA",
    zipCode: "94102",
  },
};

// Available allergens
const availableAllergens = [
  "Gluten", "Dairy", "Eggs", "Nuts", "Soy", "Sesame", "Fish", "Shellfish"
];

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  return phoneRegex.test(cleaned) && cleaned.length >= 10;
};

const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

const validateZipCode = (zip: string): boolean => {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

export default function ProfilePage() {
  const [profileData, setProfileData] = createSignal<ProfileData>(mockCurrentProfile);
  const [isEditing, setIsEditing] = createSignal(false);
  const [isSaving, setIsSaving] = createSignal(false);
  const [errors, setErrors] = createSignal<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = createSignal("");

  // Update form fields
  const updateField = (field: string, value: any) => {
    setProfileData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...prev[keys[0] as keyof ProfileData],
            [keys[1]]: value,
          },
        };
      }
      return prev;
    });

    // Clear error for this field
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  // Toggle allergen
  const toggleAllergen = (allergen: string) => {
    setProfileData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        allergens: prev.preferences.allergens.includes(allergen)
          ? prev.preferences.allergens.filter(a => a !== allergen)
          : [...prev.preferences.allergens, allergen],
      },
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const data = profileData();
    const newErrors: Record<string, string> = {};

    if (!validateRequired(data.firstName)) {
      newErrors.firstName = "First name is required";
    }
    if (!validateRequired(data.lastName)) {
      newErrors.lastName = "Last name is required";
    }
    if (!validateRequired(data.email)) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(data.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!validateRequired(data.phone)) {
      newErrors.phone = "Phone number is required";
    } else if (!validatePhone(data.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Address validation (if provided)
    if (data.address) {
      if (data.address.street && !validateRequired(data.address.street)) {
        newErrors['address.street'] = "Street address is required";
      }
      if (data.address.city && !validateRequired(data.address.city)) {
        newErrors['address.city'] = "City is required";
      }
      if (data.address.zipCode && !validateZipCode(data.address.zipCode)) {
        newErrors['address.zipCode'] = "Please enter a valid ZIP code";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setSuccessMessage("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TODO: Integrate with actual API
      console.log("Profile updated:", profileData());

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setErrors({ general: "Failed to update profile. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setProfileData(mockCurrentProfile);
    setIsEditing(false);
    setErrors({});
  };

  return (
    <AuthGuard redirectTo="/login">
      <Title>My Profile - BakeWind Bakery</Title>
      <Meta name="description" content="Manage your BakeWind Bakery account profile and preferences." />

      <main class="min-h-screen bg-bakery-cream">
        {/* Header */}
        <section class="bg-white border-b border-gray-200">
          <div class="max-w-content container-padding py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 class="text-3xl font-display font-bold text-bakery-brown mb-2">
                  My Profile
                </h1>
                <p class="text-gray-600">
                  Manage your personal information and preferences.
                </p>
              </div>
              <A href="/account" class="btn-outline mt-4 sm:mt-0">
                ← Back to Account
              </A>
            </div>
          </div>
        </section>

        {/* Success Message */}
        <Show when={successMessage()}>
          <div class="bg-green-50 border border-green-200 text-green-800 px-4 py-3">
            <div class="max-w-content container-padding">
              {successMessage()}
            </div>
          </div>
        </Show>

        {/* Profile Form */}
        <section class="section-padding">
          <div class="max-w-4xl mx-auto container-padding">
            <div class="bg-white rounded-lg shadow-md">
              {/* Form Header */}
              <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 class="text-xl font-semibold text-gray-900">
                  Personal Information
                </h2>
                <Show
                  when={!isEditing()}
                  fallback={
                    <div class="space-x-2">
                      <button
                        onClick={handleCancel}
                        class="btn-outline"
                        disabled={isSaving()}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        class="btn-primary"
                        disabled={isSaving()}
                      >
                        {isSaving() ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  }
                >
                  <button
                    onClick={() => setIsEditing(true)}
                    class="btn-primary"
                  >
                    Edit Profile
                  </button>
                </Show>
              </div>

              <div class="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={profileData().firstName}
                        onInput={(e) => updateField("firstName", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class={`input-field ${errors().firstName ? "border-red-500" : ""}`}
                      />
                      <Show when={errors().firstName}>
                        <p class="text-red-500 text-sm mt-1">{errors().firstName}</p>
                      </Show>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={profileData().lastName}
                        onInput={(e) => updateField("lastName", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class={`input-field ${errors().lastName ? "border-red-500" : ""}`}
                      />
                      <Show when={errors().lastName}>
                        <p class="text-red-500 text-sm mt-1">{errors().lastName}</p>
                      </Show>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={profileData().email}
                        onInput={(e) => updateField("email", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class={`input-field ${errors().email ? "border-red-500" : ""}`}
                      />
                      <Show when={errors().email}>
                        <p class="text-red-500 text-sm mt-1">{errors().email}</p>
                      </Show>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={profileData().phone}
                        onInput={(e) => updateField("phone", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class={`input-field ${errors().phone ? "border-red-500" : ""}`}
                      />
                      <Show when={errors().phone}>
                        <p class="text-red-500 text-sm mt-1">{errors().phone}</p>
                      </Show>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={profileData().dateOfBirth}
                        onInput={(e) => updateField("dateOfBirth", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class="input-field"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="md:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={profileData().address?.street || ""}
                        onInput={(e) => updateField("address.street", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class={`input-field ${errors()['address.street'] ? "border-red-500" : ""}`}
                        placeholder="123 Main Street"
                      />
                      <Show when={errors()['address.street']}>
                        <p class="text-red-500 text-sm mt-1">{errors()['address.street']}</p>
                      </Show>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={profileData().address?.city || ""}
                        onInput={(e) => updateField("address.city", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class={`input-field ${errors()['address.city'] ? "border-red-500" : ""}`}
                        placeholder="San Francisco"
                      />
                      <Show when={errors()['address.city']}>
                        <p class="text-red-500 text-sm mt-1">{errors()['address.city']}</p>
                      </Show>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        State
                      </label>
                      <select
                        value={profileData().address?.state || ""}
                        onChange={(e) => updateField("address.state", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class="input-field"
                      >
                        <option value="">Select State</option>
                        <option value="CA">California</option>
                        <option value="NY">New York</option>
                        <option value="TX">Texas</option>
                        <option value="FL">Florida</option>
                        {/* Add more states as needed */}
                      </select>
                    </div>

                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={profileData().address?.zipCode || ""}
                        onInput={(e) => updateField("address.zipCode", e.currentTarget.value)}
                        disabled={!isEditing()}
                        class={`input-field ${errors()['address.zipCode'] ? "border-red-500" : ""}`}
                        placeholder="94102"
                      />
                      <Show when={errors()['address.zipCode']}>
                        <p class="text-red-500 text-sm mt-1">{errors()['address.zipCode']}</p>
                      </Show>
                    </div>
                  </div>
                </div>

                {/* Dietary Preferences */}
                <div>
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Dietary Restrictions</h3>
                  <p class="text-sm text-gray-600 mb-3">
                    Select any allergens or dietary restrictions we should be aware of.
                  </p>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {availableAllergens.map((allergen) => (
                      <label class="flex items-center">
                        <input
                          type="checkbox"
                          checked={profileData().preferences.allergens.includes(allergen)}
                          onChange={() => toggleAllergen(allergen)}
                          disabled={!isEditing()}
                          class="mr-2"
                        />
                        <span class="text-sm">{allergen}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Communication Preferences */}
                <div>
                  <h3 class="text-lg font-medium text-gray-900 mb-4">Communication Preferences</h3>
                  <div class="space-y-3">
                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileData().preferences.newsletter}
                        onChange={(e) => updateField("preferences.newsletter", e.currentTarget.checked)}
                        disabled={!isEditing()}
                        class="mr-3"
                      />
                      <div>
                        <span class="font-medium">Email Newsletter</span>
                        <p class="text-sm text-gray-600">Receive weekly updates about new products and specials</p>
                      </div>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileData().preferences.smsNotifications}
                        onChange={(e) => updateField("preferences.smsNotifications", e.currentTarget.checked)}
                        disabled={!isEditing()}
                        class="mr-3"
                      />
                      <div>
                        <span class="font-medium">SMS Notifications</span>
                        <p class="text-sm text-gray-600">Get text messages about order status</p>
                      </div>
                    </label>

                    <label class="flex items-center">
                      <input
                        type="checkbox"
                        checked={profileData().preferences.specialOffers}
                        onChange={(e) => updateField("preferences.specialOffers", e.currentTarget.checked)}
                        disabled={!isEditing()}
                        class="mr-3"
                      />
                      <div>
                        <span class="font-medium">Special Offers</span>
                        <p class="text-sm text-gray-600">Receive exclusive deals and promotions</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}