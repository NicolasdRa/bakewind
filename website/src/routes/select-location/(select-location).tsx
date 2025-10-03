import { type Component, createSignal, For, Show } from "solid-js";
import { useSubmission } from "@solidjs/router";
import { useAuthUser } from "~/hooks/useAuthUser";
import { useUserLocationsServer } from "~/hooks/useUserLocationsServer";
import { selectLocation } from "~/routes/api/auth/select-location";
import { ProtectedRoute } from "~/components/ProtectedRoute";
import SEO from "~/components/SEO/SEO";
import LoadingSpinner from "~/components/LoadingSpinner";
import styles from "./select-location.module.css";

const SelectLocation: Component = () => {
  const user = useAuthUser();
  const { locations, loading, error } = useUserLocationsServer();
  const selectLocationSubmission = useSubmission(selectLocation);
  const [selectedLocation, setSelectedLocation] = createSignal<string>("");

  // Debug logging
  console.log('📍 [SELECT_LOCATION] Component state:', {
    user: user(),
    loading: loading,
    error: error,
    locations: locations(),
    locationsLength: locations()?.length,
    selectedLocation: selectedLocation()
  });

  const handleLocationSelect = (locationId: string) => {
    console.log('📍 [SELECT_LOCATION] Location selected:', locationId);
    setSelectedLocation(locationId);
  };

  return (
    <ProtectedRoute>
      <SEO
        title="Select Location"
        description="Choose your bakery location to access the dashboard."
        path="/select-location"
      />

      <div class={styles.container}>
        <div class={styles.headerSection}>
          <h2 class={styles.title}>
            Select Your Location
          </h2>
          <p class={styles.subtitle}>
            You have access to multiple locations. Please select one to continue.
          </p>
        </div>

        <div class={styles.mainSection}>
          <div class={styles.card}>
            <Show when={loading}>
              <LoadingSpinner message="Loading your locations..." />
            </Show>

            <Show when={error}>
              <div class={styles.errorState}>
                <p>Failed to load locations. Please try again.</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            </Show>

            <Show when={!loading && !error && locations() && locations()!.length === 0}>
              <div class={styles.emptyState}>
                <p>No locations found. Please contact your administrator.</p>
              </div>
            </Show>

            <Show when={!loading && !error && locations() && locations()!.length > 0}>
              <form
                class={styles.form}
                method="post"
                action={selectLocation}
              >
                <div class={styles.locationGrid}>
                  <For each={locations()}>
                    {(location) => (
                      <label
                        class={styles.locationOption}
                        classList={{
                          [styles.locationOptionActive]: selectedLocation() === location.id
                        }}
                      >
                        <input
                          type="radio"
                          name="locationId"
                          value={location.id}
                          checked={selectedLocation() === location.id}
                          onChange={() => handleLocationSelect(location.id)}
                          class={styles.radioInput}
                        />
                        <div class={styles.locationContent}>
                          <div class={styles.locationDetails}>
                            <span class={styles.locationName}>
                              {location.name}
                            </span>
                            <span class={styles.locationAddress}>
                              {location.address}, {location.city}
                              {location.state ? `, ${location.state}` : ''} {location.country}
                            </span>
                          </div>
                        </div>
                        <div class={styles.radioIndicator}>
                          <div class={styles.radioDot} />
                        </div>
                      </label>
                    )}
                  </For>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={!selectedLocation() || selectLocationSubmission.pending}
                    class={styles.submitButton}
                    classList={{
                      [styles.submitButtonDisabled]: !selectedLocation() || selectLocationSubmission.pending
                    }}
                  >
                    {selectLocationSubmission.pending ? "Processing..." : "Continue to Dashboard"}
                  </button>
                </div>

                <Show when={selectLocationSubmission.error}>
                  <div class={styles.errorState}>
                    <p>Error: {selectLocationSubmission.error.message}</p>
                  </div>
                </Show>
              </form>
            </Show>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default SelectLocation;