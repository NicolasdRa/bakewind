import { ParentComponent } from "solid-js";
import ProtectedRoute from "./ProtectedRoute";

// Protected page wrapper - cleaner than wrapping each route
const ProtectedPage: ParentComponent = (props) => (
  <ProtectedRoute children={props.children} />
);

export default ProtectedPage;