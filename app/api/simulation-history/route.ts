import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase"
import { cookies } from "next/headers"

// GET /api/simulation-history - List simulation history records
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const simulationId = searchParams.get("simulation_id")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const minScore = searchParams.get("min_score")
    const maxScore = searchParams.get("max_score")
    const minPercentage = searchParams.get("min_percentage")
    const maxPercentage = searchParams.get("max_percentage")
    const sortBy = searchParams.get("sort_by") || "completed_at"
    const sortOrder = searchParams.get("sort_order") || "desc"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Build query
    let query = supabase
      .from("simulation_history")
      .select("*")
      .eq("user_id", user.id)

    // Apply filters
    if (simulationId) {
      query = query.eq("simulation_id", simulationId)
    }
    if (dateFrom) {
      query = query.gte("completed_at", dateFrom)
    }
    if (dateTo) {
      query = query.lte("completed_at", dateTo)
    }
    if (minScore) {
      query = query.gte("score", parseInt(minScore))
    }
    if (maxScore) {
      query = query.lte("score", parseInt(maxScore))
    }
    if (minPercentage) {
      query = query.gte("percentage", parseFloat(minPercentage))
    }
    if (maxPercentage) {
      query = query.lte("percentage", parseFloat(maxPercentage))
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    return NextResponse.json({
      data,
      count,
      pagination: {
        offset,
        limit,
        total: count
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/simulation-history - Create new simulation history record
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      simulation_id,
      score,
      total_questions,
      percentage,
      time_taken_minutes,
      answers,
      completed_at
    } = body

    // Validate required fields
    if (!simulation_id || score === undefined || !total_questions || percentage === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: simulation_id, score, total_questions, percentage" },
        { status: 400 }
      )
    }

    // Validate data types and ranges
    if (typeof score !== "number" || score < 0) {
      return NextResponse.json({ error: "Score must be a non-negative number" }, { status: 400 })
    }
    if (typeof total_questions !== "number" || total_questions <= 0) {
      return NextResponse.json({ error: "Total questions must be a positive number" }, { status: 400 })
    }
    if (typeof percentage !== "number" || percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: "Percentage must be between 0 and 100" }, { status: 400 })
    }
    if (time_taken_minutes !== undefined && (typeof time_taken_minutes !== "number" || time_taken_minutes < 0)) {
      return NextResponse.json({ error: "Time taken must be a non-negative number" }, { status: 400 })
    }

    // Create record
    const recordData = {
      user_id: user.id,
      simulation_id,
      score,
      total_questions,
      percentage,
      time_taken_minutes: time_taken_minutes || null,
      answers: answers || {},
      completed_at: completed_at || new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("simulation_history")
      .insert(recordData)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create record" }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}