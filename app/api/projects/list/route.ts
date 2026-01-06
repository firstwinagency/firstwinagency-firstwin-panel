import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("projects")
      .select("id, name")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      return NextResponse.json({ projects: [] }, { status: 500 });
    }

    return NextResponse.json({ projects: data || [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}
