import type { Editor, JSONContent } from '@tiptap/vue-3'
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { titleCase } from 'scule'
import type { EditorCustomHandlers } from '@nuxt/ui'
import type { EditorSuggestionMenuItem } from '@nuxt/ui/runtime/components/EditorSuggestionMenu.vue.d.ts'
import type { EditorEmojiMenuItem } from '@nuxt/ui/runtime/components/EditorEmojiMenu.vue.d.ts'
import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.vue.d.ts'
import { gitHubEmojis } from '@tiptap/extension-emoji'
import {
  getStandardToolbarItems,
  getStandardSuggestionItems,
  standardNuxtUIComponents,
  computeStandardDragActions,
} from '../utils/tiptap/editor'
import { imageHandler, videoHandler, calloutHandler, componentHandler, tableHandler, CALLOUT_TYPES, pickInitialSlot } from '../utils/tiptap/handlers'
import { useStudio } from './useStudio'
import { resolveHostExtensions, getHostHandlers } from '../utils/tiptap/host-extensions'

const NATIVE_OVERRIDE_COMPONENTS = new Set(['table'])

/**
 * Composable for managing TipTap editor UI and configuration
 */
export function useTiptapEditor() {
  const { t } = useI18n()
  const { host } = useStudio()

  // Host-provided extensions (custom node views for MDC components)
  resolveHostExtensions(host, t as (key: string, ...args: unknown[]) => string)
  const hostHandlers = getHostHandlers()
  const hostHandlerByKind = new Map(hostHandlers.map(handler => [handler.kind, handler]))

  // Selected node for drag handle
  const selectedNode = ref<JSONContent | null>(null)

  /**
   * Component items for suggestions menu
   */
  const componentItems = computed(() => {
    return host.meta.editor.components.get()
      .filter(component => !NATIVE_OVERRIDE_COMPONENTS.has(component.name))
      .map(component => ({
        kind: component.name,
        type: undefined as never,
        label: hostHandlerByKind.get(component.name)?.label || titleCase(component.name),
        icon: hostHandlerByKind.get(component.name)?.icon || standardNuxtUIComponents[component.name]?.icon || 'i-lucide-box',
        slots: component.meta.slots,
      }))
      // Host handlers whose kind is not a discovered component still get a menu entry
      .concat(hostHandlers
        .filter(handler => !host.meta.editor.components.get().some(component => component.name === handler.kind))
        .map(handler => ({
          kind: handler.kind,
          type: undefined as never,
          label: handler.label || titleCase(handler.kind),
          icon: handler.icon || 'i-lucide-box',
          slots: [],
        })))
  })

  /**
   * Custom handlers for editor commands
   */
  const customHandlers = computed(() => ({
    image: imageHandler(),
    video: videoHandler(),
    table: tableHandler(),
    ...Object.fromEntries(
      componentItems.value.map(item => [
        item.kind,
        CALLOUT_TYPES.has(item.kind)
          ? calloutHandler(item.kind)
          : componentHandler(item.kind, pickInitialSlot(item.slots)),
      ]),
    ),
    // Host extensions override the generic component block for their kind
    ...Object.fromEntries(hostHandlers.map(handler => [handler.kind, {
      canExecute: () => true,
      execute: (editor: Editor) => handler.insert(editor),
      isActive: (editor: Editor) => handler.isActive?.(editor) ?? editor.isActive(handler.kind),
      isDisabled: undefined,
    }])),
  }) satisfies EditorCustomHandlers)

  /**
   * Suggestion menu items
   */
  const suggestionItems = computed(() => {
    const exclude = host.meta.editor.commands.exclude
    const componentGroups = host.meta.editor.components.getGroups(t('studio.tiptap.editor.components'))

    if (componentGroups.length === 0) {
      return [
        ...getStandardSuggestionItems(t, exclude),
        [
          {
            type: 'label',
            label: t('studio.tiptap.editor.components'),
          },
          ...componentItems.value,
        ],
      ] satisfies EditorSuggestionMenuItem[][]
    }

    const componentGroupItems = componentGroups.map(group => [
      {
        type: 'label' as const,
        label: group.label,
      },
      ...group.components
        .filter(component => !NATIVE_OVERRIDE_COMPONENTS.has(component.name))
        .map(component => ({
          kind: component.name,
          type: undefined as never,
          label: titleCase(component.name),
          icon: standardNuxtUIComponents[component.name]?.icon || 'i-lucide-box',
        })),
    ])

    return [
      ...getStandardSuggestionItems(t, exclude),
      ...componentGroupItems,
    ] satisfies EditorSuggestionMenuItem[][]
  })

  const toolbarItems = computed(() => getStandardToolbarItems(t, host.meta.ai.enabled))

  /**
   * Emoji items for emoji picker
   */
  const emojiItems: EditorEmojiMenuItem[] = gitHubEmojis.filter(
    emoji => !emoji.name.startsWith('regional_indicator_'),
  )

  /**
   * Drag handle menu items
   */
  function dragHandleItems(editor: Editor): DropdownMenuItem[][] {
    if (!selectedNode.value) {
      return []
    }

    return computeStandardDragActions(editor, selectedNode.value, t)
  }

  /**
   * Set selected node (for drag handle)
   */
  function setSelectedNode(node: JSONContent | null) {
    selectedNode.value = node
  }

  return {
    // State
    selectedNode,

    // Computed
    componentItems,
    customHandlers,
    suggestionItems,
    toolbarItems,
    emojiItems,

    // Functions
    dragHandleItems,
    setSelectedNode,
  }
}
