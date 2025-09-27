import { useAuthUser } from "~/hooks/useAuthUser";
import { Navigate } from "@solidjs/router";
import { type ParentComponent, Show } from "solid-js";

type Props = {
  isAllowed?: boolean;
  redirectPath?: string;
};

export const ProtectedRoute: ParentComponent<Props> = (props) => {
  const user = useAuthUser();
  const redirectPath = props.redirectPath ?? "/login";

  return (
    <Show
      when={user() && (props.isAllowed ?? true)}
      fallback={<Navigate href={redirectPath} />}
    >
      {props.children}
    </Show>
  );
};