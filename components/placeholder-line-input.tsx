'use client';

import { Extension } from '@tiptap/core';
import PlaceholderTextExtension from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  PLACEHOLDER_EDITOR_CONTENT_CLASSNAME,
  PlaceholderSuggestionExtension,
  PlaceholderTokenNode,
  wrapPlaceholdersForEditor,
} from '@/lib/tiptap-placeholder-extensions';

const NoNewlineExtension = Extension.create({
  name: 'noNewline',
  addKeyboardShortcuts() {
    return {
      Enter: () => true,
      'Shift-Enter': () => true,
    };
  },
});

interface PlaceholderLineInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PlaceholderLineInput({ id, value, onChange, placeholder }: PlaceholderLineInputProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        link: false,
        hardBreak: false,
      }),
      NoNewlineExtension,
      PlaceholderTokenNode,
      PlaceholderSuggestionExtension,
      PlaceholderTextExtension.configure({ placeholder }),
    ],
    content: wrapPlaceholdersForEditor(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        class:
          'h-8 w-full overflow-x-auto rounded-none border border-input bg-transparent px-2.5 py-1 text-xs whitespace-nowrap outline-none [&_p]:m-0 focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getText());
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`${PLACEHOLDER_EDITOR_CONTENT_CLASSNAME} [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]`}
    >
      <EditorContent editor={editor} />
    </div>
  );
}
