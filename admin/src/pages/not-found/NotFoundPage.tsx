// create a NotFound page component
import { Component } from "solid-js";

const NotFound: Component = () => {
  return (
    <div class="not-found-page">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
};

export default NotFound;