import { AnyExtension } from '@tiptap/core';
import { CollectionType } from '@nuxt/content';
import { ComarkElement } from 'comark';
import { ComarkNode } from 'comark';
import { ComponentData } from 'nuxt-component-meta';
import { Editor } from '@tiptap/core';
import { JSONContent } from '@tiptap/core';
import { Nodes } from 'mdast';
import type * as TiptapCore from '@tiptap/core';
import type * as TiptapVue from '@tiptap/vue-3';
import type * as Vue from 'vue';

export declare interface AIGenerateOptions {
    prompt?: string;
    previousContext?: string;
    nextContext?: string;
    mode?: AIMode;
    language?: string;
    selectionLength?: number;
    fsPath?: string;
    collectionName?: string;
    hintOptions?: AIHintOptions;
}

export declare interface AIHintOptions {
    cursor: CursorContext;
    previousNodeType?: string;
    headingText?: string;
    currentComponent?: string;
    currentSlot?: string;
}

/**
 * Shared AI types used across frontend and backend
 */
declare type AIMode = 'continue' | 'fix' | 'improve' | 'simplify' | 'translate';

/**
 * Callbacks for AI transform accept/decline actions
 */
export declare interface AITransformCallbacks {
    onAccept: () => void;
    onDecline: () => void;
}

declare const COMMAND_KEYS: readonly ["style", "insert", "paragraph", "heading1", "heading2", "heading3", "heading4", "bulletList", "orderedList", "blockquote", "codeBlock", "bold", "italic", "strike", "code", "image", "video", "horizontalRule", "table"];

export declare interface CommandConfig {
    exclude?: CommandKey[];
}

export declare type CommandKey = typeof COMMAND_KEYS[number];

export declare interface ComponentMeta {
    name: string;
    path: string;
    nuxtUI?: boolean;
    meta: {
        props: ComponentData['meta']['props'];
        slots: ComponentData['meta']['slots'];
        events: ComponentData['meta']['events'];
    };
}

export declare type CursorContext = 'heading-new' | 'heading-continue' | 'heading-middle' | 'paragraph-new' | 'paragraph-continue' | 'paragraph-middle' | 'sentence-new';

/**
 * Diff part for AI transform highlighting
 */
export declare interface DiffPart {
    type: 'added' | 'removed' | 'unchanged';
    text: string;
}

export declare const EMOJI_REGEXP: RegExp;

export declare interface EmojiItem {
    name: string;
    shortcodes: string[];
    group: string;
    version: number;
    emoticons?: string[];
}

export declare const emojiList: Record<string, EmojiItem>;

export declare const emojiNameToUnicodeMap: Map<string, string>;

export declare function getEmojiName(unicode: string): string;

export declare function getEmojiUnicode(name: string): string;

export declare type GitProviderType = 'github' | 'gitlab';

export declare interface MarkdownParsingOptions {
    compress?: boolean;
    collectionType?: CollectionType;
    preserveLinkAttributes?: boolean;
}

export declare function remarkEmojiPlugin(): (tree: Nodes) => void;

export declare interface StudioEditorExtension {
    extension: AnyExtension;
    mdc?: StudioEditorMdcMapping;
    handler?: StudioEditorHandler;
}

export declare interface StudioEditorExtensionContext {
    /** `@tiptap/core` primitives from Studio's bundle */
    tiptap: Pick<typeof TiptapCore, 'Node' | 'Mark' | 'Extension' | 'mergeAttributes' | 'InputRule'>;
    /** `@tiptap/vue-3` node-view helpers from Studio's bundle */
    tiptapVue: Pick<typeof TiptapVue, 'VueNodeViewRenderer' | 'NodeViewWrapper' | 'NodeViewContent' | 'nodeViewProps'>;
    /** Studio's Vue runtime — build node-view components with these, not with the host's Vue */
    vue: Pick<typeof Vue, 'h' | 'defineComponent' | 'ref' | 'computed' | 'reactive' | 'watch' | 'onMounted' | 'onBeforeUnmount' | 'resolveComponent' | 'withModifiers' | 'Fragment'>;
    /** Studio components that are useful inside node views (media library modal, props form) */
    components: {
        ModalMediaPicker: Vue.Component;
        TiptapComponentProps: Vue.Component;
    };
    /** Comark (MDC AST) helpers */
    comark: {
        isElement: (node: ComarkNode) => node is ComarkElement;
        getTag: (node: ComarkElement) => string;
        getAttrs: (node: ComarkElement) => Record<string, unknown>;
        getChildren: (node: ComarkElement) => ComarkNode[];
    };
    /** i18n translate function of the Studio UI */
    t: (key: string, ...args: unknown[]) => string;
    host: StudioHostLike;
}

export declare type StudioEditorExtensionFactory = (ctx: StudioEditorExtensionContext) => StudioEditorExtension;

/** Insert command shown in the slash menu; overrides the generic component block for `kind` */
export declare interface StudioEditorHandler {
    /** Component kind (kebab-case MDC tag), e.g. `gallery` */
    kind: string;
    label?: string;
    icon?: string;
    insert: (editor: Editor) => unknown;
    isActive?: (editor: Editor) => boolean;
}

/** How an MDC tag (`::my-component`) maps to/from the extension's TipTap node */
export declare interface StudioEditorMdcMapping {
    /** MDC tags handled by this extension, e.g. `['gallery']` */
    tags: string[];
    toTiptap: (node: ComarkElement, helpers: {
        childrenToTiptap: (children: ComarkNode[]) => JSONContent[];
    }) => JSONContent;
    toComark: (node: JSONContent, helpers: {
        childrenToComark: (children: JSONContent[]) => ComarkNode[];
    }) => ComarkElement;
}

/** Minimal host surface exposed to extensions (kept loose to avoid circular type imports) */
declare interface StudioHostLike {
    meta: {
        dev: boolean;
        media?: {
            external: boolean;
            publicUrl?: string;
        };
    };
}

export { }


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        completion: {
            /**
             * Trigger AI completion manually
             */
            triggerCompletion: () => ReturnType;
            /**
             * Accept the current completion
             */
            acceptCompletion: () => ReturnType;
            /**
             * Dismiss the current completion
             */
            dismissCompletion: () => ReturnType;
        };
    }
    interface Storage {
        aiCompletion: CompletionStorage;
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        aiTransform: {
            transformSelection: (mode: string, transformFn: () => Promise<string>) => ReturnType;
            acceptTransform: () => ReturnType;
            declineTransform: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        callout: {
            setCallout: (tag: string, slot?: string) => ReturnType;
        };
    }
}


declare module '@tiptap/vue-3' {
    interface Commands<ReturnType> {
        videoPicker: {
            insertVideoPicker: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Binding: {
            /**
             * Insert a binding node
             */
            setBinding: (attrs: BindingAttrs) => ReturnType;
            /**
             * Update the current binding node attributes
             */
            updateBinding: (attrs: BindingAttrs) => ReturnType;
            /**
             * Remove current binding node
             */
            unsetBinding: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Frontmatter: {
            handleFrontmatterBackspace: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Element: {
            setElement: (tag: string, slot?: string) => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        Slot: {
            /**
             * Override backspace command
             */
            handleSlotBackspace: () => ReturnType;
            /**
             * Move empty trailing block out of slot on double-Enter.
             */
            exitEmptyTextblockFromSlot: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        SpanStyle: {
            /**
             * Wrap selection (or insert empty) with span-style node
             */
            setSpanStyle: (attributes?: SpanStyleAttrs) => ReturnType;
            /**
             * Update attributes on current span-style node
             */
            updateSpanStyle: (attributes?: SpanStyleAttrs) => ReturnType;
            /**
             * Remove the current span-style node (unwrap content)
             */
            unsetSpanStyle: () => ReturnType;
        };
    }
}


declare module '@tiptap/vue-3' {
    interface Commands<ReturnType> {
        imagePicker: {
            insertImagePicker: () => ReturnType;
        };
    }
}


declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        InlineElement: {
            /**
             * Toggle a InlineElement
             */
            setInlineElement: (tag: string) => ReturnType;
        };
    }
}
