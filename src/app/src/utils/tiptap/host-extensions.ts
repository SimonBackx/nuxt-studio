import { Node, Mark, Extension, mergeAttributes, InputRule } from '@tiptap/core'
import type { AnyExtension } from '@tiptap/core'
import { VueNodeViewRenderer, NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'
import { h, defineComponent, ref, computed, reactive, watch, onMounted, onBeforeUnmount, resolveComponent, withModifiers, Fragment } from 'vue'
import type { StudioHost, StudioEditorExtension, StudioEditorExtensionContext, StudioEditorHandler, StudioEditorMdcMapping } from '../../types'
import { isElement, getTag, getAttrs, getChildren } from '../comark'
import ModalMediaPicker from '../../components/shared/ModalMediaPicker.vue'
import TiptapComponentProps from '../../components/tiptap/TiptapComponentProps.vue'

/**
 * Registry of editor extensions provided by the host application
 * (`host.meta.editor.extensions`). Factories are resolved once, with Studio's own
 * TipTap/Vue instances, and the results are consulted by the editor setup and by the
 * comark ⇄ TipTap transformers.
 */
let resolved: StudioEditorExtension[] | null = null
let resolvedFor: StudioHost | null = null

export function resolveHostExtensions(host: StudioHost, t: (key: string, ...args: unknown[]) => string): StudioEditorExtension[] {
  if (resolved && resolvedFor === host) return resolved

  const factories = host.meta.editor.extensions?.get() ?? []
  const ctx: StudioEditorExtensionContext = {
    tiptap: { Node, Mark, Extension, mergeAttributes, InputRule },
    tiptapVue: { VueNodeViewRenderer, NodeViewWrapper, NodeViewContent, nodeViewProps },
    vue: { h, defineComponent, ref, computed, reactive, watch, onMounted, onBeforeUnmount, resolveComponent, withModifiers, Fragment },
    components: { ModalMediaPicker, TiptapComponentProps },
    comark: { isElement, getTag, getAttrs, getChildren },
    t,
    host,
  }

  resolved = factories.flatMap((factory) => {
    try {
      return [factory(ctx)]
    }
    catch (error) {
      console.error('[nuxt-studio] Failed to create host editor extension', error)
      return []
    }
  })
  resolvedFor = host
  return resolved
}

export function getHostTiptapExtensions(): AnyExtension[] {
  return (resolved ?? []).map(e => e.extension)
}

export function getHostHandlers(): StudioEditorHandler[] {
  return (resolved ?? []).flatMap(e => e.handler ? [e.handler] : [])
}

export function findHostMdcByTag(tag: string): StudioEditorMdcMapping | undefined {
  return (resolved ?? []).find(e => e.mdc?.tags.includes(tag))?.mdc
}

export function findHostMdcByNodeType(type: string | undefined): StudioEditorMdcMapping | undefined {
  if (!type) return undefined
  return (resolved ?? []).find(e => e.mdc && e.extension.name === type)?.mdc
}
