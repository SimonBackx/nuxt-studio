// ─── Host-provided editor extensions ─────────────────────────────────────────
//
// A host application (the Nuxt site) can register custom TipTap extensions for the
// visual editor, e.g. a dedicated node view for one of its MDC components.
//
// Studio ships its own copies of TipTap and Vue inside a shadow-root custom element, so
// host code must never import those itself: an extension is a *factory* that receives
// Studio's instances through `StudioEditorExtensionContext` and builds the extension with them.

import type { AnyExtension, Editor, JSONContent } from '@tiptap/core'
import type { ComarkElement, ComarkNode } from 'comark'

export interface StudioEditorExtensionContext {
  /** `@tiptap/core` primitives from Studio's bundle */
  tiptap: {
    Node: typeof import('@tiptap/core').Node
    Mark: typeof import('@tiptap/core').Mark
    Extension: typeof import('@tiptap/core').Extension
    mergeAttributes: typeof import('@tiptap/core').mergeAttributes
    InputRule: typeof import('@tiptap/core').InputRule
  }
  /** `@tiptap/vue-3` node-view helpers from Studio's bundle */
  tiptapVue: {
    VueNodeViewRenderer: typeof import('@tiptap/vue-3').VueNodeViewRenderer
    NodeViewWrapper: typeof import('@tiptap/vue-3').NodeViewWrapper
    NodeViewContent: typeof import('@tiptap/vue-3').NodeViewContent
    nodeViewProps: typeof import('@tiptap/vue-3').nodeViewProps
  }
  /** Studio's Vue runtime — build node-view components with these, not with the host's Vue */
  vue: Pick<typeof import('vue'), 'h' | 'defineComponent' | 'ref' | 'computed' | 'reactive' | 'watch' | 'onMounted' | 'onBeforeUnmount' | 'resolveComponent' | 'withModifiers' | 'Fragment'>
  /** Studio components that are useful inside node views (media library modal, props form) */
  components: {
    ModalMediaPicker: import('vue').Component
    TiptapComponentProps: import('vue').Component
  }
  /** Comark (MDC AST) helpers */
  comark: {
    isElement: (node: ComarkNode) => node is ComarkElement
    getTag: (node: ComarkElement) => string
    getAttrs: (node: ComarkElement) => Record<string, unknown>
    getChildren: (node: ComarkElement) => ComarkNode[]
  }
  /** i18n translate function of the Studio UI */
  t: (key: string, ...args: unknown[]) => string
  host: StudioHostLike
}

/** Minimal host surface exposed to extensions (kept loose to avoid circular type imports) */
export interface StudioHostLike {
  meta: { dev: boolean, media?: { external: boolean, publicUrl?: string } }
}

/** How an MDC tag (`::my-component`) maps to/from the extension's TipTap node */
export interface StudioEditorMdcMapping {
  /** MDC tags handled by this extension, e.g. `['gallery']` */
  tags: string[]
  toTiptap: (node: ComarkElement, helpers: { childrenToTiptap: (children: ComarkNode[]) => JSONContent[] }) => JSONContent
  toComark: (node: JSONContent, helpers: { childrenToComark: (children: JSONContent[]) => ComarkNode[] }) => ComarkElement
}

/** Insert command shown in the slash menu; overrides the generic component block for `kind` */
export interface StudioEditorHandler {
  /** Component kind (kebab-case MDC tag), e.g. `gallery` */
  kind: string
  label?: string
  icon?: string
  insert: (editor: Editor) => unknown
  isActive?: (editor: Editor) => boolean
}

export interface StudioEditorExtension {
  extension: AnyExtension
  mdc?: StudioEditorMdcMapping
  handler?: StudioEditorHandler
}

export type StudioEditorExtensionFactory = (ctx: StudioEditorExtensionContext) => StudioEditorExtension
