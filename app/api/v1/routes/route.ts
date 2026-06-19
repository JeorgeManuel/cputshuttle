import { NextResponse } from "next/server";
import { getAllRoutes } from "@/lib/routeSeed";

export async function GET() {
  return NextResponse.json({
    routes: getAllRoutes()
  });
}
