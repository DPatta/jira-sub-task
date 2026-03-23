import React from "react"
import { AdfDocument, AdfNode, AdfMark } from "@/types/jira"

function applyMarks(text: string, marks: AdfMark[] | undefined, key: string): React.ReactNode {
  if (!marks || marks.length === 0) return text

  let node: React.ReactNode = text
  for (let i = marks.length - 1; i >= 0; i--) {
    const mark = marks[i]
    const markKey = `${key}-mark-${i}`
    switch (mark.type) {
      case "strong":
        node = <strong key={markKey}>{node}</strong>
        break
      case "em":
        node = <em key={markKey}>{node}</em>
        break
      case "code":
        node = (
          <code key={markKey} className="bg-gray-100 px-1 rounded text-xs font-mono">
            {node}
          </code>
        )
        break
      case "underline":
        node = (
          <span key={markKey} style={{ textDecoration: "underline" }}>
            {node}
          </span>
        )
        break
      case "strike":
        node = <s key={markKey}>{node}</s>
        break
      case "link":
        node = (
          <a
            key={markKey}
            href={mark.attrs.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {node}
          </a>
        )
        break
      case "textColor":
        node = (
          <span key={markKey} style={{ color: mark.attrs.color }}>
            {node}
          </span>
        )
        break
    }
  }
  return node
}

function renderNode(node: AdfNode, keyPrefix: string, issueUrl?: string): React.ReactNode {
  const key = keyPrefix

  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))

    case "paragraph":
      return (
        <p key={key} className="mb-2 last:mb-0">
          {(node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))}
        </p>
      )

    case "heading": {
      const level = (node as { type: "heading"; attrs: { level: number }; content?: AdfNode[] }).attrs.level
      const children = (node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))
      const headingClass = "font-semibold mb-1"
      if (level === 1) return <h1 key={key} className={headingClass}>{children}</h1>
      if (level === 2) return <h2 key={key} className={headingClass}>{children}</h2>
      if (level === 3) return <h3 key={key} className={headingClass}>{children}</h3>
      if (level === 4) return <h4 key={key} className={headingClass}>{children}</h4>
      if (level === 5) return <h5 key={key} className={headingClass}>{children}</h5>
      return <h6 key={key} className={headingClass}>{children}</h6>
    }

    case "bulletList":
      return (
        <ul key={key} className="list-disc pl-5 mb-2 space-y-0.5">
          {(node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))}
        </ul>
      )

    case "orderedList":
      return (
        <ol key={key} className="list-decimal pl-5 mb-2 space-y-0.5">
          {(node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))}
        </ol>
      )

    case "listItem":
      return (
        <li key={key}>
          {(node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))}
        </li>
      )

    case "codeBlock": {
      const codeText = (node.content ?? [])
        .filter((n) => n.type === "text")
        .map((n) => (n as { type: "text"; text: string }).text)
        .join("")
      return (
        <pre key={key} className="bg-gray-100 rounded p-2 text-xs overflow-auto mb-2 font-mono">
          <code>{codeText}</code>
        </pre>
      )
    }

    case "blockquote":
      return (
        <blockquote key={key} className="border-l-4 border-gray-300 pl-3 text-gray-600 italic mb-2">
          {(node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))}
        </blockquote>
      )

    case "hardBreak":
      return <br key={key} />

    case "rule":
      return <hr key={key} className="my-3 border-gray-200" />

    case "text": {
      const textNode = node as { type: "text"; text: string; marks?: AdfMark[] }
      return applyMarks(textNode.text, textNode.marks, key)
    }

    case "mention": {
      const mentionNode = node as { type: "mention"; attrs: { id: string; displayName?: string; text?: string } }
      const displayName = mentionNode.attrs.displayName || mentionNode.attrs.text || mentionNode.attrs.id
      return (
        <span key={key} className="text-blue-600">
          @{displayName}
        </span>
      )
    }

    case "inlineCard": {
      const cardNode = node as { type: "inlineCard"; attrs: { url: string } }
      return (
        <a
          key={key}
          href={cardNode.attrs.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-xs"
        >
          {cardNode.attrs.url}
        </a>
      )
    }

    case "blockCard": {
      const cardNode = node as { type: "blockCard"; attrs: { url: string } }
      const url = cardNode.attrs.url
      let hostname = url
      try { hostname = new URL(url).hostname } catch { /* keep full url */ }
      return (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 my-2 px-3 py-2 rounded border text-sm hover:bg-blue-50 transition-colors"
          style={{ borderColor: "#DFE1E6", color: "#0052CC", textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <span className="flex-1 truncate">{hostname}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      )
    }

    case "mediaSingle": {
      return (
        <div key={key} className="my-2">
          {(node.content ?? []).map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))}
        </div>
      )
    }

    case "media": {
      const mediaNode = node as {
        type: "media"
        attrs: { id?: string; url?: string; alt?: string; width?: number; height?: number }
      }
      const { url, alt } = mediaNode.attrs

      // External image with direct URL — render inline.
      // next/image cannot be used here because the URL origin is unknown at build time.
      if (url) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={key}
            src={url}
            alt={alt ?? "image"}
            style={{ maxWidth: "100%", height: "auto", maxHeight: 480, borderRadius: 4, display: "block", margin: "4px 0" }}
          />
        )
      }

      // Jira-hosted media requires OAuth/media token — show clickable placeholder
      const inner = (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>{alt ?? "Attached image"}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.5 }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </>
      )

      const sharedStyle = {
        display: "flex" as const,
        alignItems: "center" as const,
        gap: "6px",
        padding: "6px 12px",
        background: "#F4F5F7",
        border: "1px dashed #DFE1E6",
        borderRadius: 4,
        fontSize: 12,
        color: "#42526E",
        margin: "4px 0",
        textDecoration: "none",
      }

      if (issueUrl) {
        return (
          <a key={key} href={issueUrl} target="_blank" rel="noopener noreferrer" style={{ ...sharedStyle, cursor: "pointer" }}>
            {inner}
          </a>
        )
      }

      return <div key={key} style={sharedStyle}>{inner}</div>
    }

    default: {
      // Fallback: render children if any
      const fallbackNode = node as { type: string; content?: AdfNode[] }
      if (fallbackNode.content && fallbackNode.content.length > 0) {
        return (
          <React.Fragment key={key}>
            {fallbackNode.content.map((child, i) => renderNode(child, `${key}-${i}`, issueUrl))}
          </React.Fragment>
        )
      }
      return null
    }
  }
}

export function renderAdf(doc: AdfDocument | null | undefined, issueUrl?: string): React.ReactNode {
  if (!doc) return null
  if (doc.type !== "doc") return null

  const content = (doc.content ?? []).map((node, i) => renderNode(node, `adf-${i}`, issueUrl))

  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      {content}
    </div>
  )
}
