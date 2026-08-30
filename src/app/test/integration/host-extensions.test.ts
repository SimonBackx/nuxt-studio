import { test, describe, expect, beforeAll } from 'vitest'
import { Editor } from '@tiptap/core'
import type { JSONContent } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Mention from '@tiptap/extension-mention'
import { contentFromDocument, documentFromContent } from '../../../module/dist/runtime/utils/document'
import type { DatabasePageItem, StudioHost, StudioEditorExtensionFactory } from '../../src/types'
import { createMockDocument } from '../mocks/document'
import { comarkToTiptap } from '../../src/utils/tiptap/comarkToTiptap'
import { tiptapToComark } from '../../src/utils/tiptap/tiptapToComark'
import { studioStarterKitOptions, createStudioExtensions } from '../../src/utils/tiptap/studio-extensions'
import { resolveHostExtensions, getHostTiptapExtensions, getHostHandlers, findHostMdcByTag } from '../../src/utils/tiptap/host-extensions'

/**
 * A host-provided "gallery" extension: `::gallery{caption}` with markdown images inside
 * becomes an atom node carrying the images as attributes, and serialises back to the same MDC.
 */
const galleryFactory: StudioEditorExtensionFactory = ({ tiptap, comark }) => {
  const Gallery = tiptap.Node.create({
    name: 'gallery',
    group: 'block',
    atom: true,
    addAttributes: () => ({ images: { default: [] }, caption: { default: '' } }),
    parseHTML: () => [{ tag: 'div[data-type="gallery"]' }],
    renderHTML: ({ HTMLAttributes }) => ['div', tiptap.mergeAttributes(HTMLAttributes, { 'data-type': 'gallery' })],
  })

  return {
    extension: Gallery,
    mdc: {
      tags: ['gallery'],
      toTiptap: (node) => {
        const images: Array<{ src: string, alt: string }> = []
        const walk = (n: Parameters<typeof comark.isElement>[0]) => {
          if (!comark.isElement(n)) return
          if (comark.getTag(n) === 'img') {
            const attrs = comark.getAttrs(n)
            images.push({ src: String(attrs.src), alt: String(attrs.alt ?? '') })
            return
          }
          comark.getChildren(n).forEach(walk)
        }
        comark.getChildren(node).forEach(walk)
        return { type: 'gallery', attrs: { images, caption: String(comark.getAttrs(node).caption ?? '') } }
      },
      toComark: (node) => {
        const images = (node.attrs?.images ?? []) as Array<{ src: string, alt: string }>
        const caption = node.attrs?.caption as string
        return ['gallery', caption ? { caption } : {}, ...images.map(img => ['p', {}, ['img', { alt: img.alt, src: img.src }]])] as never
      },
    },
    handler: {
      kind: 'gallery',
      label: 'Gallery',
      insert: editor => editor.chain().focus().insertContent({ type: 'gallery', attrs: { images: [], caption: '' } }).run(),
    },
  }
}

function createHostEditor(json: JSONContent): Editor {
  return new Editor({
    extensions: [
      StarterKit.configure({ ...studioStarterKitOptions, horizontalRule: false }),
      HorizontalRule,
      Mention,
      ...createStudioExtensions({ additionalExtensions: getHostTiptapExtensions() }),
    ],
    content: json,
  })
}

describe('host editor extensions', () => {
  beforeAll(() => {
    const host = { meta: { dev: false, editor: { extensions: { get: () => [galleryFactory] } } } } as unknown as StudioHost
    resolveHostExtensions(host, key => key)
  })

  test('factory is resolved with Studio context and exposes handler + mdc mapping', () => {
    expect(getHostTiptapExtensions().map(e => e.name)).toEqual(['gallery'])
    expect(getHostHandlers().map(h => h.kind)).toEqual(['gallery'])
    expect(findHostMdcByTag('gallery')).toBeDefined()
    expect(findHostMdcByTag('unknown')).toBeUndefined()
  })

  test('::gallery round-trips through the custom node', async () => {
    const inputContent = [
      'Intro paragraph',
      '',
      '::gallery{caption="During the works"}',
      '![Site during installation](/images/a.jpg)',
      '',
      '![Drawer assembly](/images/b.jpg)',
      '::',
    ].join('\n')

    const document = await documentFromContent('test.md', inputContent) as DatabasePageItem
    const tiptapJSON = comarkToTiptap(document.body)

    expect(tiptapJSON.content?.[2]).toMatchObject({
      type: 'gallery',
      attrs: {
        caption: 'During the works',
        images: [
          { src: '/images/a.jpg', alt: 'Site during installation' },
          { src: '/images/b.jpg', alt: 'Drawer assembly' },
        ],
      },
    })

    // Through a real editor that has the host extension registered
    const editor = createHostEditor(tiptapJSON)
    const editorJSON = editor.getJSON()
    editor.destroy()
    expect(editorJSON.content?.[2]?.type).toBe('gallery')

    const rtComarkTree = await tiptapToComark(editorJSON)
    expect(rtComarkTree.nodes).toMatchObject([
      ['p', {}, 'Intro paragraph'],
      ['gallery', { caption: 'During the works' },
        ['p', {}, ['img', { alt: 'Site during installation', src: '/images/a.jpg' }]],
        ['p', {}, ['img', { alt: 'Drawer assembly', src: '/images/b.jpg' }]],
      ],
    ])

    const generatedDocument = createMockDocument('docs/test.md', { body: rtComarkTree, ...rtComarkTree.frontmatter })
    const outputContent = await contentFromDocument(generatedDocument)
    expect(outputContent).toBe(`${inputContent}\n`)
  })

  test('handler inserts the custom node instead of a generic element', () => {
    const editor = createHostEditor({ type: 'doc', content: [{ type: 'paragraph', content: [] }] })
    getHostHandlers()[0]!.insert(editor)
    expect(editor.getJSON().content?.some(n => n.type === 'gallery')).toBe(true)
    editor.destroy()
  })
})
