import { Extension, Node, mergeAttributes, escapeForRegEx, type Editor, type Range } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, {
  type SuggestionOptions,
  type SuggestionProps,
  type Trigger,
  type SuggestionMatch,
} from '@tiptap/suggestion';
import { forwardRef } from 'react';
import { PlaceholderMenu, type PlaceholderMenuRef } from '@/components/placeholder-menu';
import type { PlaceholderField } from '@/lib/email-placeholders';

/**
 * A placeholder like `{{contact.name}}` is a single atomic token, not plain text: the cursor can't land
 * inside it, and Backspace/Delete remove it whole, the same way Slack treats an inserted mention.
 * `renderHTML`/`renderText` still serialize it back to the literal `{{key}}` string so the backend's
 * simple string-replace at send time doesn't need to change.
 */
export const PlaceholderTokenNode = Node.create({
  name: 'placeholderToken',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      value: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-value'),
        renderHTML: (attributes) => ({ 'data-value': attributes.value as string }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-placeholder-token]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-placeholder-token': '', class: 'placeholder-mention' }),
      `{{${node.attrs.value as string}}}`,
    ];
  },
  renderText({ node }) {
    return `{{${node.attrs.value as string}}}`;
  },
});

const BARE_PLACEHOLDER_REGEX = /\{\{([^{}\s]+)\}\}/g;
const WRAPPED_PLACEHOLDER_REGEX = /<span[^>]*data-placeholder-token[^>]*>\{\{[^{}]+\}\}<\/span>/g;

/**
 * Converts bare `{{key}}` text (the format stored server-side) into the token span our node parses,
 * so loading a saved template turns its placeholders back into atomic nodes. Unwraps first so re-running
 * this on content that already has wrapper spans (e.g. round-tripped through the editor) doesn't nest them.
 */
export function wrapPlaceholdersForEditor(source: string): string {
  const unwrapped = source.replace(WRAPPED_PLACEHOLDER_REGEX, (match) => {
    const inner = /\{\{[^{}]+\}\}/.exec(match);
    return inner ? inner[0] : match;
  });
  // Split on tags so `{{...}}` inside an attribute (e.g. href="{{whatsapp.link}}") is left alone —
  // only occurrences in actual text content get turned into placeholder nodes.
  return unwrapped
    .split(/(<[^>]*>)/g)
    .map((segment, index) => {
      const isTag = index % 2 === 1;
      if (isTag) {
        return segment;
      }
      return segment.replace(BARE_PLACEHOLDER_REGEX, (_match, key: string) => {
        return `<span data-placeholder-token data-value="${key}" class="placeholder-mention">{{${key}}}</span>`;
      });
    })
    .join('');
}

const TiptapPlaceholderMenu = forwardRef<PlaceholderMenuRef, SuggestionProps<PlaceholderField>>(
  function TiptapPlaceholderMenu(props, ref) {
    return <PlaceholderMenu ref={ref} query={props.query} onSelect={(field) => props.command(field)} />;
  },
);

/**
 * Tiptap's default suggestion matcher only excludes whitespace and the trigger char itself, so once
 * `{{key}}` is inserted, the `}}` doesn't stop the match and the suggestion stays "open" around the very
 * text it just inserted. This variant also excludes `}` so the match closes right after insertion.
 */
function findPlaceholderSuggestionMatch({ char, allowedPrefixes, startOfLine, $position }: Trigger): SuggestionMatch {
  const escapedChar = escapeForRegEx(char);
  const prefix = startOfLine ? '^' : '';
  const regexp = new RegExp(`${prefix}(?:^)?${escapedChar}[^\\s${escapedChar}}]*`, 'gm');
  const text = ($position.nodeBefore?.isText && $position.nodeBefore.text) || false;
  if (!text) {
    return null;
  }
  const textFrom = $position.pos - text.length;
  const match = Array.from(text.matchAll(regexp)).pop();
  if (!match || match.input === undefined || match.index === undefined) {
    return null;
  }
  const matchPrefix = match.input.slice(Math.max(0, match.index - 1), match.index);
  const matchPrefixIsAllowed = new RegExp(`^[${allowedPrefixes?.join('') ?? ''}\0]?$`).test(matchPrefix);
  if (allowedPrefixes !== null && !matchPrefixIsAllowed) {
    return null;
  }
  const from = textFrom + match.index;
  const to = from + match[0].length;
  if (from < $position.pos && to >= $position.pos) {
    return { range: { from, to }, query: match[0].slice(char.length), text: match[0] };
  }
  return null;
}

function createPlaceholderSuggestion(): Omit<SuggestionOptions<PlaceholderField>, 'editor'> {
  return {
    char: '{{',
    allowSpaces: false,
    findSuggestionMatch: findPlaceholderSuggestionMatch,
    items: () => [],
    command: ({ editor, range, props }: { editor: Editor; range: Range; props: PlaceholderField }) => {
      editor
        .chain()
        .focus()
        .insertContentAt(range, { type: 'placeholderToken', attrs: { value: props.value } })
        .run();
    },
    render: () => {
      let component: ReactRenderer<PlaceholderMenuRef, SuggestionProps<PlaceholderField>>;
      let popupEl: HTMLDivElement;

      return {
        onStart: (props) => {
          component = new ReactRenderer(TiptapPlaceholderMenu, { props, editor: props.editor });
          popupEl = document.createElement('div');
          popupEl.style.position = 'absolute';
          popupEl.style.zIndex = '50';
          document.body.appendChild(popupEl);
          popupEl.appendChild(component.element);
          const rect = props.clientRect?.();
          if (rect) {
            popupEl.style.top = `${rect.bottom + window.scrollY}px`;
            popupEl.style.left = `${rect.left + window.scrollX}px`;
          }
        },
        onUpdate: (props) => {
          component.updateProps(props);
          const rect = props.clientRect?.();
          if (rect) {
            popupEl.style.top = `${rect.bottom + window.scrollY}px`;
            popupEl.style.left = `${rect.left + window.scrollX}px`;
          }
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            popupEl.remove();
            return true;
          }
          return component.ref?.onKeyDown(props.event) ?? false;
        },
        onExit: () => {
          popupEl.remove();
          component.destroy();
        },
      };
    },
  };
}

export const PlaceholderSuggestionExtension = Extension.create({
  name: 'placeholderSuggestionTrigger',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...createPlaceholderSuggestion(),
      }),
    ];
  },
});

export const PLACEHOLDER_EDITOR_CONTENT_CLASSNAME =
  '[&_.placeholder-mention]:rounded-sm [&_.placeholder-mention]:bg-primary/10 [&_.placeholder-mention]:px-0.5 [&_.placeholder-mention]:text-primary';
