import { describe, expect, it } from 'vitest'
import { validateWorkflow } from '../domain/validation'
import {
  deserializeDocument,
  DOCUMENT_LIMITS,
  projectDocument,
  serializeDocument,
  validateDocument,
  type WorkflowDocument,
} from './workflowDocument'
import { readWorkflowFile, workflowFileName } from '../services/workflowFiles'

const document: WorkflowDocument = {
  schemaVersion: 1,
  id: 'draft-1',
  name: '분기 워크플로',
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 12, y: 20 },
      data: { label: 'Start', description: '' },
    },
    {
      id: 'condition',
      type: 'condition',
      position: { x: 245, y: -75 },
      data: { label: '분기', description: '<p>Text</p>' },
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 450, y: 120 },
      data: { label: 'End', description: '' },
    },
  ],
  edges: [
    {
      id: 'start-out',
      source: 'start',
      target: 'condition',
      sourceHandle: 'out',
      targetHandle: 'in',
    },
    {
      id: 'branch-true',
      source: 'condition',
      target: 'end',
      sourceHandle: 'true',
      targetHandle: 'in',
    },
    {
      id: 'branch-false',
      source: 'condition',
      target: 'end',
      sourceHandle: 'false',
      targetHandle: 'in',
    },
  ],
  viewport: { x: -123, y: 56, zoom: 1.5 },
}

describe('workflow document', () => {
  it('round-trips a UTF-8 document, element IDs, branch handles, coordinates and viewport', () => {
    const text = serializeDocument(document)
    expect(text).toContain('\n  "schemaVersion": 1,')
    expect(deserializeDocument(text)).toEqual(document)
    expect(validateDocument(document)).toEqual(document)
  })

  it('projects only document fields from the live editor', () => {
    const position = { ...document.nodes[0].position }
    const snapshot = projectDocument({
      documentId: document.id,
      documentName: document.name,
      nodes: [
        {
          ...document.nodes[0],
          position,
          selected: true,
          dragging: true,
          measured: { width: 170, height: 65 },
          deletable: false,
        },
        ...document.nodes.slice(1),
      ],
      edges: [
        { ...document.edges[0], selected: true },
        ...document.edges.slice(1),
      ],
      viewport: document.viewport,
    })
    expect(snapshot).toEqual(document)
    position.x = 400
    expect(snapshot.nodes[0].position.x).toBe(12)
  })

  it.each([
    ['null', 'invalid-field'],
    ['[]', 'invalid-field'],
    ['{', 'json-syntax'],
    ['{}', 'missing-field'],
    [JSON.stringify({ ...document, schemaVersion: 2 }), 'unsupported-version'],
    [JSON.stringify({ ...document, schemaVersion: '1' }), 'invalid-field'],
    [
      JSON.stringify({
        ...document,
        nodes: [{ ...document.nodes[0], type: 'trigger' }],
      }),
      'invalid-field',
    ],
    [
      JSON.stringify({
        ...document,
        nodes: [{ ...document.nodes[0], type: undefined }],
      }),
      'missing-field',
    ],
    [
      JSON.stringify({
        ...document,
        nodes: [...document.nodes, document.nodes[0]],
      }),
      'duplicate-id',
    ],
    [
      JSON.stringify({
        ...document,
        edges: [...document.edges, document.edges[0]],
      }),
      'duplicate-id',
    ],
    [
      JSON.stringify({
        ...document,
        edges: [{ ...document.edges[0], target: 'missing' }],
      }),
      'missing-reference',
    ],
    [
      JSON.stringify({
        ...document,
        edges: [{ ...document.edges[0], sourceHandle: null }],
      }),
      'invalid-field',
    ],
    [
      JSON.stringify({
        ...document,
        edges: [{ ...document.edges[0], sourceHandle: 'false' }],
      }),
      'invalid-field',
    ],
    [
      JSON.stringify({
        ...document,
        viewport: { ...document.viewport, x: '10' },
      }),
      'invalid-field',
    ],
    [JSON.stringify(document).replace('"x":12', '"x":1e999'), 'invalid-field'],
    [
      JSON.stringify({
        ...document,
        viewport: { ...document.viewport, zoom: 0 },
      }),
      'invalid-field',
    ],
    [
      JSON.stringify({
        ...document,
        nodes: Array.from({ length: 501 }, () => document.nodes[0]),
      }),
      'too-large',
    ],
    [
      JSON.stringify({
        ...document,
        name: 'a'.repeat(DOCUMENT_LIMITS.name + 1),
      }),
      'invalid-field',
    ],
    [' '.repeat(DOCUMENT_LIMITS.bytes + 1), 'too-large'],
  ])('rejects invalid document case %#', (text, code) => {
    expect(() => deserializeDocument(text)).toThrow(
      expect.objectContaining({ code }),
    )
  })

  it('accepts an incomplete draft and leaves execution checks to the graph validator', () => {
    const draft = deserializeDocument(
      serializeDocument({
        ...document,
        nodes: document.nodes.slice(0, 1),
        edges: [],
      }),
    )
    expect(validateWorkflow(draft.nodes, draft.edges).valid).toBe(false)
    expect(draft.nodes).toHaveLength(1)
  })

  it('reads UTF-8 files and rejects invalid UTF-8 or oversized files before parsing', async () => {
    await expect(
      readWorkflowFile(new File([serializeDocument(document)], 'draft.json')),
    ).resolves.toEqual(document)
    await expect(
      readWorkflowFile(new File([new Uint8Array([255])], 'draft.json')),
    ).rejects.toMatchObject({ code: 'json-syntax' })
    await expect(
      readWorkflowFile(
        new File([new Uint8Array(DOCUMENT_LIMITS.bytes + 1)], 'draft.json'),
      ),
    ).rejects.toMatchObject({ code: 'too-large' })
  })

  it.each([
    ['', 'workflow.json'],
    [' .. ', 'workflow.json'],
    ['CON', 'workflow.json'],
    ['분기 흐름', '분기-흐름.json'],
    ['Report: Q4', 'Report--Q4.json'],
  ])('uses safe filenames for %s', (name, expected) => {
    expect(workflowFileName(name)).toBe(expected)
  })
})
