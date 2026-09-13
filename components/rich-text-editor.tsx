'use client';

import type { Editor } from '@tiptap/core';
import LinkExtension from '@tiptap/extension-link';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholderLineInput } from '@/components/placeholder-line-input';
import {
  PLACEHOLDER_EDITOR_CONTENT_CLASSNAME,
  PlaceholderSuggestionExtension,
  PlaceholderTokenNode,
  wrapPlaceholdersForEditor,
} from '@/lib/tiptap-placeholder-extensions';

const WHATSAPP_LINK_PLACEHOLDER_VALUES = new Set(['whatsapp.number', 'whatsapp.link']);

interface ToolbarButtonConfig {
  icon: LucideIcon;
  label: string;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}

function useToolbarButtons(): ToolbarButtonConfig[] {
  return useMemo(
    () => [
      {
        icon: BoldIcon,
        label: 'Bold',
        isActive: (editor) => editor.isActive('bold'),
        run: (editor) => editor.chain().focus().toggleBold().run(),
      },
      {
        icon: ItalicIcon,
        label: 'Italic',
        isActive: (editor) => editor.isActive('italic'),
        run: (editor) => editor.chain().focus().toggleItalic().run(),
      },
      {
        icon: UnderlineIcon,
        label: 'Strike',
        isActive: (editor) => editor.isActive('strike'),
        run: (editor) => editor.chain().focus().toggleStrike().run(),
      },
      {
        icon: ListIcon,
        label: 'Bullet List',
        isActive: (editor) => editor.isActive('bulletList'),
        run: (editor) => editor.chain().focus().toggleBulletList().run(),
      },
      {
        icon: ListOrderedIcon,
        label: 'Numbered List',
        isActive: (editor) => editor.isActive('orderedList'),
        run: (editor) => editor.chain().focus().toggleOrderedList().run(),
      },
    ],
    [],
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  whatsappMessage?: string;
  onWhatsappMessageChange?: (value: string) => void;
  whatsappLinkText?: string;
  onWhatsappLinkTextChange?: (value: string) => void;
}

export function RichTextEditor({
  value,
  onChange,
  whatsappMessage,
  onWhatsappMessageChange,
  whatsappLinkText,
  onWhatsappLinkTextChange,
}: RichTextEditorProps) {
  const toolbarButtons = useToolbarButtons();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrlDraft, setLinkUrlDraft] = useState('');
  const [linkTextDraft, setLinkTextDraft] = useState('');
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappMessageDraft, setWhatsappMessageDraft] = useState(whatsappMessage ?? '');
  const [whatsappLinkTextDraft, setWhatsappLinkTextDraft] = useState(whatsappLinkText ?? '');
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      PlaceholderTokenNode,
      PlaceholderSuggestionExtension,
    ],
    content: wrapPlaceholdersForEditor(value),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-64 rounded-none border border-input bg-transparent px-2.5 py-2 text-xs outline-none',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(updatedEditor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  function openLinkDialog() {
    if (editor!.isActive('link')) {
      editor!.chain().extendMarkRange('link').run();
    }
    const { from, to, empty } = editor!.state.selection;
    const text = empty ? '' : editor!.state.doc.textBetween(from, to, ' ');
    const previousUrl = editor!.getAttributes('link').href as string | undefined;
    setLinkTextDraft(text);
    setLinkUrlDraft(previousUrl ?? 'https://');
    setLinkDialogOpen(true);
  }

  function applyLink() {
    const url = linkUrlDraft.trim();
    const text = linkTextDraft.trim();
    if (!url) {
      setLinkDialogOpen(false);
      return;
    }
    const { from, to, empty } = editor!.state.selection;
    const chain = editor!.chain().focus();
    if (text) {
      if (!empty) {
        chain.deleteRange({ from, to });
      }
      chain.insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href: url } }] });
    } else if (!empty) {
      chain.extendMarkRange('link').setLink({ href: url });
    } else {
      chain.insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] });
    }
    chain.run();
    setLinkDialogOpen(false);
  }

  function openWhatsappDialog() {
    setWhatsappMessageDraft(whatsappMessage ?? '');
    setWhatsappLinkTextDraft(whatsappLinkText ?? '');
    setWhatsappDialogOpen(true);
  }

  function applyWhatsappMessage() {
    onWhatsappMessageChange?.(whatsappMessageDraft.trim());
    onWhatsappLinkTextChange?.(whatsappLinkTextDraft.trim());
    setWhatsappDialogOpen(false);
  }

  function removeLink() {
    editor!.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkDialogOpen(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1 rounded-none bg-muted/20 p-1 ring-1 ring-foreground/10">
        {toolbarButtons.map((button) => (
          <Button
            key={button.label}
            type="button"
            variant={button.isActive(editor) ? 'default' : 'ghost'}
            size="icon-sm"
            aria-label={button.label}
            onClick={() => button.run(editor)}
          >
            <button.icon className="size-3.5" />
          </Button>
        ))}
        <Button
          type="button"
          variant={editor.isActive('link') ? 'default' : 'ghost'}
          size="icon-sm"
          aria-label="Link"
          onClick={openLinkDialog}
        >
          <LinkIcon className="size-3.5" />
        </Button>
      </div>
      <div
        className={`${PLACEHOLDER_EDITOR_CONTENT_CLASSNAME} [&_a]:cursor-pointer [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/50 [&_a]:underline-offset-2`}
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest('a')) {
            e.preventDefault();
            // Defer a tick: ProseMirror hasn't finished syncing the click's caret position into
            // editor.state yet when this capture-phase handler runs.
            setTimeout(openLinkDialog, 0);
          }
        }}
        onDoubleClick={(e) => {
          const token = (e.target as HTMLElement).closest('[data-placeholder-token]');
          const tokenValue = token?.getAttribute('data-value');
          if (tokenValue && WHATSAPP_LINK_PLACEHOLDER_VALUES.has(tokenValue)) {
            e.preventDefault();
            openWhatsappDialog();
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rte-link-text">Text</Label>
            <Input
              id="rte-link-text"
              value={linkTextDraft}
              onChange={(e) => setLinkTextDraft(e.target.value)}
              placeholder="Text to display"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                }
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rte-link-url">Link</Label>
            <Input
              id="rte-link-url"
              value={linkUrlDraft}
              onChange={(e) => setLinkUrlDraft(e.target.value)}
              placeholder="https://"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                }
              }}
            />
          </div>
          <DialogFooter>
            {editor.isActive('link') ? (
              <Button type="button" variant="outline" onClick={removeLink}>
                Remove Link
              </Button>
            ) : null}
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="button" onClick={applyLink}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={whatsappDialogOpen} onOpenChange={setWhatsappDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>WhatsApp Message</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rte-whatsapp-message">Prefilled message</Label>
            <PlaceholderLineInput
              id="rte-whatsapp-message"
              value={whatsappMessageDraft}
              onChange={setWhatsappMessageDraft}
              placeholder="Hi, I am {{contact.name}}, I have received your email and I am still interested in your {{job.title}} position."
              multiline
            />
            <p className="text-xs text-muted-foreground">
              This is what pre-fills when the candidate taps the WhatsApp link — type <code>{'{{'}</code> to insert the
              candidate&apos;s name or the job title. Leave blank to use the default message.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rte-whatsapp-link-text">Link text</Label>
            <PlaceholderLineInput
              id="rte-whatsapp-link-text"
              value={whatsappLinkTextDraft}
              onChange={setWhatsappLinkTextDraft}
              placeholder="Message us on WhatsApp"
            />
            <p className="text-xs text-muted-foreground">
              What the candidate sees as the clickable text for <code>{'{{whatsapp.link}}'}</code> when it&apos;s used
              directly in the body (not wrapped in its own link via the link icon). Leave blank to use the default text.
            </p>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost" />}>Cancel</DialogClose>
            <Button type="button" onClick={applyWhatsappMessage}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
