/**
 * Compatibility shim replacing `react-router` with TanStack Router.
 *
 * Keeps the ported call sites working unchanged:
 *  - Link / NavLink accept `to` (string).
 *  - useNavigate returns a callable taking a string path (or -1 for back).
 *  - useParams returns the current route params (loose).
 *  - useLocation returns { pathname, search } with search as a string.
 *  - Navigate renders an immediate redirect.
 *  - useSearchParams returns [URLSearchParams, setParams].
 */
import {
  Link as TsLink,
  Navigate as TsNavigate,
  useLocation as useTsLocation,
  useNavigate as useTsNavigate,
  useParams as useTsParams,
  useRouter,
} from "@tanstack/react-router";
import { useCallback, type ComponentProps, type ReactNode } from "react";

export function Link(props: ComponentProps<typeof TsLink>) {
  return <TsLink {...props} />;
}

export function NavLink({
  to,
  className,
  children,
  end,
  ...rest
}: {
  to: string;
  end?: boolean;
  className?: string | ((opts: { isActive: boolean }) => string);
  children?: ReactNode | ((opts: { isActive: boolean }) => ReactNode);
  [key: string]: unknown;
}) {
  const location = useTsLocation();
  const isActive =
    location.pathname === to ||
    (!end && to !== "/" && location.pathname.startsWith(`${to}/`));
  const resolved = typeof className === "function" ? className({ isActive }) : className;
  const resolvedChildren = typeof children === "function" ? children({ isActive }) : children;
  return (
    <TsLink to={to} className={resolved} {...rest}>
      {resolvedChildren}
    </TsLink>
  );
}

export function useNavigate() {
  const navigate = useTsNavigate();
  const router = useRouter();
  return useCallback(
    (to: string | number, opts?: { replace?: boolean }) => {
      if (typeof to === "number") {
        if (to === -1) router.history.back();
        else if (to === 1) router.history.forward();
        return;
      }
      return navigate({ to, replace: opts?.replace });
    },
    [navigate, router],
  );
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useTsParams({ strict: false } as never) as T;
}

export function useLocation() {
  const location = useTsLocation();
  return {
    pathname: location.pathname,
    search: location.searchStr ?? "",
    hash: location.hash ?? "",
  };
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  return <TsNavigate to={to} replace={replace} />;
}

export function useSearchParams(): [
  URLSearchParams,
  (next: URLSearchParams | Record<string, string>, opts?: { replace?: boolean }) => void,
] {
  const location = useTsLocation();
  const navigate = useTsNavigate();
  const params = new URLSearchParams(location.searchStr ?? "");
  const setParams = useCallback(
    (next: URLSearchParams | Record<string, string>, opts?: { replace?: boolean }) => {
      const sp =
        next instanceof URLSearchParams
          ? next
          : new URLSearchParams(next as Record<string, string>);
      navigate({
        to: `${location.pathname}?${sp.toString()}`,
        replace: opts?.replace,
      });
    },
    [location.pathname, navigate],
  );
  return [params, setParams];
}
