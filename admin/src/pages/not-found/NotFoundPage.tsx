import { Component } from "solid-js";
import { Heading, Text } from "~/components/common/Typography";

const NotFound: Component = () => {
  return (
    <div class="not-found-page">
      <Heading variant="page">404 - Page Not Found</Heading>
      <Text color="secondary">The page you are looking for does not exist.</Text>
    </div>
  );
};

export default NotFound;