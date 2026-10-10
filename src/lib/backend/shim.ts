/**
 * Compatibility shim replacing `convex/react`.
 *
 * The app was built against Convex hooks; on Lovable the same call sites now
 * run against plain async functions (see ./api.ts) backed by React Query.
 * Convex semantics preserved:
 *  - useQuery returns `undefined` while loading.
 *  - Passing "skip" as the args, Convex-style, disables the query.
 *  - useMutation/useAction return an async callable.
 *  - useConvex returns an imperative { query, mutation, action } caller.
 */
import {
  useMutation as useRqMutation,
  useQuery as useRqQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type FnRef<Args = any, Result = any> = {
  readonly _path: string;
  readonly _run: (args: Args) => Promise<Result>;
};

export function defineFn<Args, Result>(
  path: string,
  run: (args: Args) => Promise<Result>,
): FnRef<Args, Result> {
  return { _path: path, _run: run };
}

export type Skippable<Args> = Args | "skip";

export function useQuery<Args, Result>(
  fn: FnRef<Args, Result> | undefined,
  args?: Skippable<Args>,
): Result | undefined {
  const skipped = args === "skip";
  const resolvedArgs = (skipped ? undefined : (args ?? ({} as Args))) as Args;
  const query = useRqQuery({
    queryKey: [fn?._path, resolvedArgs],
    queryFn: () => fn!._run(resolvedArgs),
    enabled: !!fn && !skipped,
    staleTime: 30_000,
  });
  return query.data;
}

export function useMutation<Args, Result>(
  fn: FnRef<Args, Result>,
): (args: Args) => Promise<Result> {
  const mutation = useRqMutation({ mutationFn: (a: Args) => fn._run(a) });
  return mutation.mutateAsync;
}

export function useAction<Args, Result>(
  fn: FnRef<Args, Result>,
): (args: Args) => Promise<Result> {
  return useMutation(fn);
}

/** Imperative caller matching the subset of the Convex client the app uses. */
export function useConvex() {
  const queryClient = useQueryClient();
  return {
    query: <A, R>(fn: FnRef<A, R>, args: A): Promise<R> =>
      queryClient.fetchQuery({
        queryKey: [fn._path, args],
        queryFn: () => fn._run(args),
        staleTime: 30_000,
      }),
    mutation: <A, R>(fn: FnRef<A, R>, args: A): Promise<R> => fn._run(args),
    action: <A, R>(fn: FnRef<A, R>, args: A): Promise<R> => fn._run(args),
  };
}
