import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin.from("guests").select("*");
    if (error) {
      console.error("Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    console.error("API get error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, side } = body;

    if (!name || !side) {
      return NextResponse.json(
        { error: "Name and side are required" },
        { status: 400 }
      );
    }

    console.log("Adding guest:", { name, side });

    const { data, error } = await supabaseAdmin
      .from("guests")
      .insert([
        {
          name,
          side,
        },
      ])
      .select();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    console.log("Guest added successfully:", data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
