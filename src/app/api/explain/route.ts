import { handleExplain } from "@/lib/explain-route";

export async function POST(request: Request) {
  return handleExplain(request);
}
