import type { Instrumentation } from "next";
import { captureServerError } from "@/lib/error-reporter";

// Global server-side error hook: Next calls this for uncaught errors in route
// handlers, server components, server actions, and the proxy/middleware.
export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  await captureServerError(err, {
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
  });
};
