import { NextRequest, NextResponse } from "next/server"

type RouteContext = { params: Promise<{ path: string[] }> }

async function handleRequest(req: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const { path: pathSegments } = await params

    const siteUrl = req.headers.get("x-jira-site")
    const email = req.headers.get("x-jira-email")
    const token = req.headers.get("x-jira-token")

    if (!siteUrl || !email || !token) {
      return NextResponse.json({ error: "Missing Jira credentials" }, { status: 401 })
    }

    // Validate siteUrl is a legitimate Atlassian domain (prevents SSRF)
    try {
      const parsed = new URL(siteUrl)
      const isAtlassian =
        parsed.protocol === "https:" &&
        (parsed.hostname.endsWith(".atlassian.net") ||
          parsed.hostname.endsWith(".atlassian.com"))
      if (!isAtlassian) {
        return NextResponse.json({ error: "Invalid Jira site URL" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid Jira site URL" }, { status: 400 })
    }

    // Build target URL
    const targetPath = pathSegments.join("/")
    const searchParams = req.nextUrl.searchParams.toString()
    const targetUrl = `${siteUrl}/rest/api/3/${targetPath}${searchParams ? `?${searchParams}` : ""}`

    // Build Basic Auth header
    const credentials = Buffer.from(`${email}:${token}`).toString("base64")

    // Forward the request
    const forwardHeaders: Record<string, string> = {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers: forwardHeaders,
    }

    // Forward body for non-GET requests
    if (req.method !== "GET" && req.method !== "HEAD") {
      const bodyText = await req.text()
      if (bodyText) {
        fetchOptions.body = bodyText
      }
    }

    const response = await fetch(targetUrl, fetchOptions)

    // Parse response - may be empty for 204
    const responseText = await response.text()

    if (!responseText) {
      return new NextResponse(null, { status: response.status })
    }

    let responseData: unknown
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { text: responseText }
    }

    return NextResponse.json(responseData, { status: response.status })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

export async function GET(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  return handleRequest(req, context)
}

export async function POST(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  return handleRequest(req, context)
}

export async function PUT(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  return handleRequest(req, context)
}

export async function DELETE(req: NextRequest, context: RouteContext): Promise<NextResponse> {
  return handleRequest(req, context)
}
