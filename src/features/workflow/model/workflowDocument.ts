import { z } from 'zod'
import { workflowPorts, type WorkflowNodeType } from '../domain/connection'
import {
  projectGraph,
  type WorkflowEdge,
  type WorkflowNode,
} from './workflowNode'

export const SCHEMA_VERSION = 1
export const DOCUMENT_LIMITS = {
  bytes: 1024 * 1024,
  nodes: 500,
  edges: 1000,
  id: 128,
  name: 120,
  label: 120,
  description: 4000,
} as const

export const DEFAULT_VIEWPORT = { x: 0, y: 0, zoom: 1 }
export const MIN_ZOOM = 0.5
export const MAX_ZOOM = 2

const identifier = z
  .string()
  .min(1)
  .max(DOCUMENT_LIMITS.id)
  .regex(
    /^[a-zA-Z0-9_.:-]+$/,
    'Use letters, digits, dots, underscores, colons or hyphens.',
  )
const nodeTypes = Object.keys(workflowPorts).filter(
  (type): type is WorkflowNodeType => Object.hasOwn(workflowPorts, type),
)
const positionSchema = z.strictObject({ x: z.number(), y: z.number() })

const documentSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: identifier,
  name: z.string().max(DOCUMENT_LIMITS.name),
  nodes: z
    .array(
      z.strictObject({
        id: identifier,
        type: z.enum(nodeTypes),
        position: positionSchema,
        data: z.strictObject({
          label: z.string().max(DOCUMENT_LIMITS.label),
          description: z.string().max(DOCUMENT_LIMITS.description),
        }),
      }),
    )
    .max(DOCUMENT_LIMITS.nodes),
  edges: z
    .array(
      z.strictObject({
        id: identifier,
        source: identifier,
        sourceHandle: identifier,
        target: identifier,
        targetHandle: identifier,
      }),
    )
    .max(DOCUMENT_LIMITS.edges),
  viewport: positionSchema.extend({
    zoom: z.number().min(MIN_ZOOM).max(MAX_ZOOM),
  }),
})

export type WorkflowDocument = z.infer<typeof documentSchema>

export interface DocumentState {
  documentId: string
  documentName: string
  nodes: readonly WorkflowNode[]
  edges: readonly WorkflowEdge[]
  viewport: WorkflowDocument['viewport']
}

export function projectDocument({
  documentId,
  documentName,
  nodes,
  edges,
  viewport,
}: DocumentState) {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: documentId,
    name: documentName,
    ...projectGraph({ nodes, edges }),
    viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
  }
}

export type DocumentErrorCode =
  | 'too-large'
  | 'json-syntax'
  | 'unsupported-version'
  | 'missing-field'
  | 'invalid-field'
  | 'duplicate-id'
  | 'missing-reference'

export class WorkflowDocumentError extends Error {
  constructor(
    public readonly code: DocumentErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'WorkflowDocumentError'
  }
}

function assertTextSize(text: string) {
  if (
    text.length > DOCUMENT_LIMITS.bytes ||
    new TextEncoder().encode(text).length > DOCUMENT_LIMITS.bytes
  ) {
    throw new WorkflowDocumentError(
      'too-large',
      'The workflow JSON exceeds 1 MiB.',
    )
  }
}

function parseVersion(document: unknown) {
  if (
    typeof document !== 'object' ||
    !document ||
    !('schemaVersion' in document)
  )
    return

  const version = document.schemaVersion
  if (typeof version === 'number' && version !== SCHEMA_VERSION) {
    throw new WorkflowDocumentError(
      'unsupported-version',
      'This workflow uses an unsupported schema version. FlowForge supports version 1.',
    )
  }
}

export function validateDocument(input: unknown): WorkflowDocument {
  parseVersion(input)
  if (typeof input === 'object' && input) {
    for (const field of ['nodes', 'edges'] as const) {
      const entries = Reflect.get(input, field)
      if (Array.isArray(entries) && entries.length > DOCUMENT_LIMITS[field]) {
        throw new WorkflowDocumentError(
          'too-large',
          `The workflow has too many ${field} (limit ${DOCUMENT_LIMITS[field]}).`,
        )
      }
    }
  }
  const result = documentSchema.safeParse(input)
  if (!result.success) {
    const missing = result.error.issues.find(
      (issue) =>
        issue.path.length > 0 &&
        issue.path.reduce<unknown>(
          (value, key) =>
            typeof value === 'object' && value !== null
              ? Reflect.get(value, key)
              : value,
          input,
        ) === undefined,
    )
    const issue = missing ?? result.error.issues[0]
    const location = issue.path.join('.') || 'document'
    throw new WorkflowDocumentError(
      missing ? 'missing-field' : 'invalid-field',
      missing
        ? `Required field missing: ${location}.`
        : `Invalid field ${location}: ${issue.message}`,
    )
  }

  const { nodes, edges } = result.data
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const edgeIds = new Set(edges.map((edge) => edge.id))
  if (nodesById.size !== nodes.length || edgeIds.size !== edges.length) {
    throw new WorkflowDocumentError(
      'duplicate-id',
      'Node IDs must be unique, and connection IDs must be unique.',
    )
  }
  for (const edge of edges) {
    const source = nodesById.get(edge.source)
    const target = nodesById.get(edge.target)
    if (!source || !target) {
      throw new WorkflowDocumentError(
        'missing-reference',
        `Connection “${edge.id}” references a missing node.`,
      )
    }
    if (
      !workflowPorts[source.type].outputs.some(
        (id) => id === edge.sourceHandle,
      ) ||
      workflowPorts[target.type].input !== edge.targetHandle
    ) {
      throw new WorkflowDocumentError(
        'invalid-field',
        `Connection “${edge.id}” references a handle that does not exist on its node.`,
      )
    }
  }
  return result.data
}

export function deserializeDocument(text: string): WorkflowDocument {
  assertTextSize(text)
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new WorkflowDocumentError(
      'json-syntax',
      'The file is not valid JSON.',
    )
  }
  const document = validateDocument(value)
  assertTextSize(JSON.stringify(document, null, 2))
  return document
}

export function serializeDocument(input: unknown): string {
  const text = JSON.stringify(validateDocument(input), null, 2)
  assertTextSize(text)
  return text
}
