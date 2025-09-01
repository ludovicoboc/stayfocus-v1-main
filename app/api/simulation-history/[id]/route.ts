import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"

// GET /api/simulation-history/[id] - Get specific simulation history record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Get record
    const { data, error } = await supabase
      .from("simulation_history")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Record not found" }, { status: 404 })
      }
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/simulation-history/[id] - Update specific simulation history record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const {
      score,
      total_questions,
      percentage,
      time_taken_minutes,
      answers,
      completed_at
    } = body

    // Build update object with only provided fields
    const updateData: any = {}

    if (score !== undefined) {
      if (typeof score !== "number" || score < 0) {
        return NextResponse.json({ error: "Score must be a non-negative number" }, { status: 400 })
      }
      updateData.score = score
    }

    if (total_questions !== undefined) {
      if (typeof total_questions !== "number" || total_questions <= 0) {
        return NextResponse.json({ error: "Total questions must be a positive number" }, { status: 400 })
      }
      updateData.total_questions = total_questions
    }

    if (percentage !== undefined) {
      if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
        return NextResponse.json({ error: "Percentage must be between 0 and 100" }, { status: 400 })
      }
      updateData.percentage = percentage
    }

    if (time_taken_minutes !== undefined) {
      if (time_taken_minutes !== null && (typeof time_taken_minutes !== "number" || time_taken_minutes < 0)) {
        return NextResponse.json({ error: "Time taken must be a non-negative number or null" }, { status: 400 })
      }
      updateData.time_taken_minutes = time_taken_minutes
    }

    if (answers !== undefined) {
      if (typeof answers !== "object" || Array.isArray(answers)) {
        return NextResponse.json({ error: "Answers must be an object" }, { status: 400 })
      }
      updateData.answers = answers
    }

    if (completed_at !== undefined) {
      // Validate ISO date string
      if (typeof completed_at !== "string" || isNaN(Date.parse(completed_at))) {
        return NextResponse.json({ error: "Completed at must be a valid ISO date string" }, { status: 400 })
      }
      updateData.completed_at = completed_at
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    // Update record
    const { data, error } = await supabase
      .from("simulation_history")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Record not found" }, { status: 404 })
      }
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update record" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/simulation-history/[id] - Delete specific simulation history record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Validate ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 })
    }

    // Check if record exists and belongs to user
    const { data: existingRecord, error: checkError } = await supabase
      .from("simulation_history")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single()

    if (checkError) {
      if (checkError.code === "PGRST116") {
        return NextResponse.json({ error: "Record not found" }, { status: 404 })
      }
      console.error("Database error:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Delete record
    const { error } = await supabase
      .from("simulation_history")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
    }

    return NextResponse.json({ message: "Record deleted successfully" })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}