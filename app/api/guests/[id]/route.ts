// app/api/guests/[id]/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params; // <-- unwrap the Promise
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "Missing ID in request" }, { status: 400 });
    }

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("guests")
      .update(body)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("PATCH exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params; // <-- unwrap the Promise
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json({ error: "Missing ID in request" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("guests")
      .delete()
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("DELETE exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}