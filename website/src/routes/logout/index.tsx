import { type Component, onMount } from "solid-js";
import { logoutUser } from "~/routes/api/auth/logout";
import styles from "./logout.module.css";

const LogoutScreen: Component = () => {
  // Submit the form automatically when the component mounts
  let formRef: HTMLFormElement | undefined;

  onMount(() => {
    console.log('🚪 [LOGOUT_SCREEN] Submitting logout form...');
    formRef?.requestSubmit();
  });

  return (
    <div class={styles.container}>
      <div class={styles.wrapper}>
        <div class={styles.card}>
          <div class={styles.content}>
            <div class={styles.spinner}></div>
            <h2 class={styles.title}>
              Logging out...
            </h2>
            <p class={styles.subtitle}>
              You are being redirected to the login page.
            </p>
          </div>
        </div>
      </div>
      <form
        ref={formRef}
        action={logoutUser}
        method="post"
        style="display: none;"
      >
        <button type="submit">Logout</button>
      </form>
    </div>
  );
};

export default LogoutScreen;