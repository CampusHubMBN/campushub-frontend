// src/components/articles/ArticleEditor.tsx
'use client';

// ✅ Imports depuis ce que la version installée exporte réellement
import { useEditor, EditorContent, Node } from '@tiptap/react';

import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Link as LinkIcon, Quote, Minus, Undo, Redo, Code,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, ImageIcon, Type,
  Info, AlertCircle, Lightbulb, CheckCircle,
  ChevronDown,
} from 'lucide-react';

// ─── Extension call-out ───────────────────────────────────────────────────────
const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'inline*',
  defining: true,
  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (el: Element) => el.getAttribute('data-type'),
        renderHTML: (attrs: Record<string, string>) => ({ 'data-type': attrs.type }),
      },
    };
  },
  parseHTML() { return [{ tag: 'div[data-callout]' }]; },
  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
    return ['div', { 'data-callout': '', ...HTMLAttributes }, 0];
  },
});

// ─── Palettes ─────────────────────────────────────────────────────────────────
const TEXT_COLORS = [
  { label: 'Défaut',  value: 'inherit', cls: 'bg-campus-gray-900' },
  { label: 'Bleu',    value: '#0038BC', cls: 'bg-campus-blue'     },
  { label: 'Orange',  value: '#EF8F00', cls: 'bg-campus-orange'   },
  { label: 'Rouge',   value: '#DC2626', cls: 'bg-red-500'         },
  { label: 'Vert',    value: '#16A34A', cls: 'bg-green-600'       },
  { label: 'Gris',    value: '#757575', cls: 'bg-campus-gray-600' },
];
const HIGHLIGHT_COLORS = [
  { label: 'Jaune',  value: '#FEF08A' },
  { label: 'Bleu',   value: '#BFDBFE' },
  { label: 'Orange', value: '#FED7AA' },
  { label: 'Vert',   value: '#BBF7D0' },
  { label: 'Rose',   value: '#FBCFE8' },
];
const FONT_SIZES = [
  { label: 'Petit',  value: '0.875rem' },
  { label: 'Normal', value: '1rem'     },
  { label: 'Grand',  value: '1.125rem' },
  { label: 'Titre',  value: '1.25rem'  },
];
const CALLOUT_TYPES = [
  { value: 'info',    label: 'Info',      Icon: Info,        bg: 'bg-campus-blue-50 text-campus-blue-700'     },
  { value: 'warning', label: 'Attention', Icon: AlertCircle, bg: 'bg-campus-orange-50 text-campus-orange-700' },
  { value: 'tip',     label: 'Conseil',   Icon: Lightbulb,   bg: 'bg-green-50 text-green-700'                 },
  { value: 'success', label: 'Succès',    Icon: CheckCircle, bg: 'bg-emerald-50 text-emerald-700'             },
] as const;

// ─── UI helpers ───────────────────────────────────────────────────────────────
function Btn({ onClick, active, disabled, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded transition-colors flex-shrink-0',
        active ? 'bg-campus-blue-100 text-campus-blue' : 'text-campus-gray-600 hover:bg-campus-gray-100',
        disabled && 'opacity-40 cursor-not-allowed'
      )}
    >{children}</button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-campus-gray-200 mx-0.5 flex-shrink-0" />;
}

function Dropdown({ label, icon: Icon, children }: {
  label?: string; icon?: React.ElementType; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button type="button"
        onMouseDown={(e) => { e.preventDefault(); setOpen(v => !v); }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="h-7 flex items-center gap-1 px-1.5 rounded text-xs text-campus-gray-600 hover:bg-campus-gray-100 transition-colors"
      >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label && <span>{label}</span>}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-campus-gray-200 rounded-lg shadow-lg py-1 min-w-max">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Bubble menu custom (sans dépendance externe) ─────────────────────────────
function CustomBubbleMenu({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [pos, setPos]     = useState<{ top: number; left: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;

    const updateMenu = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) { setVisible(false); return; }

      // Récupère les coordonnées de la sélection dans le DOM
      const domSelection = window.getSelection();
      if (!domSelection || domSelection.rangeCount === 0) { setVisible(false); return; }

      const range = domSelection.getRangeAt(0);
      const rect  = range.getBoundingClientRect();

      if (rect.width === 0) { setVisible(false); return; }

      setPos({
        top:  rect.top + window.scrollY - 48, // au-dessus de la sélection
        left: rect.left + window.scrollX + rect.width / 2,
      });
      setVisible(true);
    };

    editor.on('selectionUpdate', updateMenu);
    editor.on('transaction',     updateMenu);

    return () => {
      editor.off('selectionUpdate', updateMenu);
      editor.off('transaction',     updateMenu);
    };
  }, [editor]);

  if (!visible || !pos || !editor) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top:      pos.top,
        left:     pos.left,
        transform: 'translateX(-50%)',
        zIndex:   9999,
      }}
      // Empêcher la perte de focus de l'éditeur au clic sur le menu
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-0.5 bg-campus-gray-900 rounded-lg px-2 py-1.5 shadow-xl"
    >
      {/* Gras / Italique */}
      {([
        { t: 'B', action: () => editor.chain().focus().toggleBold().run(),   active: editor.isActive('bold'),   cls: 'font-bold' },
        { t: 'I', action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), cls: 'italic'    },
      ]).map(({ t, action, active, cls }) => (
        <button key={t} type="button" onMouseDown={(e) => { e.preventDefault(); action(); }}
          className={cn('h-6 w-6 flex items-center justify-center rounded text-xs transition-colors', cls,
            active ? 'bg-white text-campus-gray-900' : 'text-white hover:bg-campus-gray-700'
          )}
        >{t}</button>
      ))}

      <div className="w-px h-4 bg-campus-gray-600 mx-0.5" />

      {/* Couleurs rapides */}
      {TEXT_COLORS.slice(1, 5).map(({ value, cls }) => (
        <button key={value} type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(value).run(); }}
          className={cn('h-4 w-4 rounded-full border border-campus-gray-600 hover:scale-110 transition-transform', cls)}
        />
      ))}

      <div className="w-px h-4 bg-campus-gray-600 mx-0.5" />

      {/* Surlignage */}
      <button type="button"
        onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: '#FEF08A' }).run(); }}
        className={cn('h-6 w-6 flex items-center justify-center rounded transition-colors',
          editor.isActive('highlight') ? 'bg-white text-campus-gray-900' : 'text-white hover:bg-campus-gray-700'
        )}
      ><Highlighter className="h-3 w-3" /></button>

      <div className="w-px h-4 bg-campus-gray-600 mx-0.5" />

      {/* Alignement */}
      {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as [string, React.ElementType][]).map(([align, Icon]) => (
        <button key={align} type="button"
          onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setTextAlign(align).run(); }}
          className={cn('h-6 w-6 flex items-center justify-center rounded transition-colors',
            editor.isActive({ textAlign: align }) ? 'bg-white text-campus-gray-900' : 'text-white hover:bg-campus-gray-700'
          )}
        ><Icon className="h-3 w-3" /></button>
      ))}
    </div>,
    document.body
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ArticleEditorProps {
  content?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ArticleEditor({
  content = '',
  onChange,
  placeholder = 'Rédigez votre article ici...',
  onImageUpload,
}: ArticleEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        codeBlock: { HTMLAttributes: { class: 'bg-campus-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm overflow-x-auto' } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-campus-blue underline underline-offset-2 cursor-pointer' },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Image.configure({ HTMLAttributes: { class: 'rounded-lg max-w-full my-4 mx-auto block shadow-sm' } }),
      Callout,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'before:content-[attr(data-placeholder)] before:text-campus-gray-400 before:float-left before:pointer-events-none before:h-0',
      }),
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class: cn(
          'min-h-[480px] p-5 focus:outline-none prose prose-sm max-w-none',
          'prose-headings:text-campus-gray-900 prose-headings:font-semibold',
          'prose-p:text-campus-gray-700 prose-p:leading-relaxed',
          'prose-a:text-campus-blue prose-a:no-underline hover:prose-a:underline',
          'prose-strong:text-campus-gray-900 prose-li:text-campus-gray-700',
          'prose-blockquote:border-l-4 prose-blockquote:border-campus-blue prose-blockquote:pl-4 prose-blockquote:text-campus-gray-600',
          'prose-img:rounded-lg prose-img:shadow-sm prose-img:mx-auto',
          '[&_div[data-callout]]:rounded-lg [&_div[data-callout]]:border [&_div[data-callout]]:p-4 [&_div[data-callout]]:my-3 [&_div[data-callout]]:not-prose',
          '[&_div[data-type=info]]:bg-campus-blue-50 [&_div[data-type=info]]:border-campus-blue-200 [&_div[data-type=info]]:text-campus-blue-800',
          '[&_div[data-type=warning]]:bg-campus-orange-50 [&_div[data-type=warning]]:border-campus-orange-200 [&_div[data-type=warning]]:text-campus-orange-800',
          '[&_div[data-type=tip]]:bg-green-50 [&_div[data-type=tip]]:border-green-200 [&_div[data-type=tip]]:text-green-800',
          '[&_div[data-type=success]]:bg-emerald-50 [&_div[data-type=success]]:border-emerald-200 [&_div[data-type=success]]:text-emerald-800',
        ),
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url  = window.prompt('URL du lien', prev ?? 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const handleImageFile = useCallback(async (file: File) => {
    if (!editor) return;
    if (onImageUpload) {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result)
          editor.chain().focus().setImage({ src: e.target.result as string }).run();
      };
      reader.readAsDataURL(file);
    }
  }, [editor, onImageUpload]);

  const insertCallout = useCallback((type: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent({
      type: 'callout',
      attrs: { type },
      content: [{ type: 'text', text: 'Écrivez ici...' }],
    }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="border border-campus-gray-300 rounded-lg overflow-hidden">
        <div className="h-14 bg-campus-gray-50 border-b border-campus-gray-200 animate-pulse" />
        <div className="min-h-[480px] p-5 bg-white">
          <p className="text-campus-gray-400 text-sm">{placeholder}</p>
        </div>
      </div>
    );
  }

  const charCount = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div className="border border-campus-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-campus-blue focus-within:border-campus-blue transition-all">

      {/* ── Toolbar fixe ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-campus-gray-200 bg-campus-gray-50 sticky top-0 z-10">
        <Btn title="Annuler" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-3.5 w-3.5" /></Btn>
        <Btn title="Refaire" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn title="H2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 className="h-3.5 w-3.5" /></Btn>
        <Btn title="H3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}><Heading3 className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn title="Gras"     onClick={() => editor.chain().focus().toggleBold().run()}   active={editor.isActive('bold')}   ><Bold     className="h-3.5 w-3.5" /></Btn>
        <Btn title="Italique" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} ><Italic   className="h-3.5 w-3.5" /></Btn>
        <Btn title="Code"     onClick={() => editor.chain().focus().toggleCode().run()}   active={editor.isActive('code')}   ><Code     className="h-3.5 w-3.5" /></Btn>
        <Btn title="Lien"     onClick={setLink}                                           active={editor.isActive('link')}   ><LinkIcon className="h-3.5 w-3.5" /></Btn>
        <Sep />

        {/* Taille */}
        <Dropdown label="Taille" icon={Type}>
          {FONT_SIZES.map(({ label, value }) => (
            <button key={value} type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setMark('textStyle', { fontSize: value }).run(); }}
              className="w-full text-left px-3 py-1.5 hover:bg-campus-gray-50"
            ><span style={{ fontSize: value }} className="text-campus-gray-700">{label}</span></button>
          ))}
          <button type="button"
            onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetMark('textStyle').run(); }}
            className="w-full text-left px-3 py-1.5 text-xs text-campus-gray-400 hover:bg-campus-gray-50 border-t border-campus-gray-100"
          >Réinitialiser</button>
        </Dropdown>

        {/* Couleurs */}
        <Dropdown icon={Highlighter}>
          <div className="p-2.5 space-y-2.5">
            <div>
              <p className="text-xs text-campus-gray-500 mb-1.5">Couleur du texte</p>
              <div className="flex gap-1.5">
                {TEXT_COLORS.map(({ label, value, cls }) => (
                  <button key={value} type="button" title={label}
                    onMouseDown={(e) => { e.preventDefault(); value === 'inherit' ? editor.chain().focus().unsetColor().run() : editor.chain().focus().setColor(value).run(); }}
                    className={cn('h-5 w-5 rounded-full border-2 border-white shadow hover:scale-110 transition-transform', cls)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-campus-gray-500 mb-1.5">Surlignage</p>
              <div className="flex gap-1.5">
                {HIGHLIGHT_COLORS.map(({ label, value }) => (
                  <button key={value} type="button" title={label}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color: value }).run(); }}
                    className="h-5 w-5 rounded-full border border-campus-gray-200 shadow hover:scale-110 transition-transform"
                    style={{ backgroundColor: value }}
                  />
                ))}
                <button type="button" title="Enlever"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); }}
                  className="h-5 w-5 rounded-full border border-campus-gray-300 flex items-center justify-center text-campus-gray-400 hover:bg-campus-gray-100 text-xs"
                >✕</button>
              </div>
            </div>
          </div>
        </Dropdown>

        <Sep />
        <Btn title="Gauche"  onClick={() => editor.chain().focus().setTextAlign('left').run()}   active={editor.isActive({ textAlign: 'left'   })}><AlignLeft   className="h-3.5 w-3.5" /></Btn>
        <Btn title="Centre"  onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}><AlignCenter  className="h-3.5 w-3.5" /></Btn>
        <Btn title="Droite"  onClick={() => editor.chain().focus().setTextAlign('right').run()}  active={editor.isActive({ textAlign: 'right'  })}><AlignRight   className="h-3.5 w-3.5" /></Btn>
        <Sep />
        <Btn title="Puces"       onClick={() => editor.chain().focus().toggleBulletList().run()}  active={editor.isActive('bulletList')} ><List        className="h-3.5 w-3.5" /></Btn>
        <Btn title="Numérotée"   onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Btn title="Citation"    onClick={() => editor.chain().focus().toggleBlockquote().run()}  active={editor.isActive('blockquote')} ><Quote       className="h-3.5 w-3.5" /></Btn>
        <Btn title="Séparateur"  onClick={() => editor.chain().focus().setHorizontalRule().run()}                                        ><Minus       className="h-3.5 w-3.5" /></Btn>
        <Sep />

        {/* Call-out */}
        <Dropdown label="Bloc" icon={Info}>
          {CALLOUT_TYPES.map(({ value, label, Icon, bg }) => (
            <button key={value} type="button"
              onMouseDown={(e) => { e.preventDefault(); insertCallout(value); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-campus-gray-50"
            >
              <span className={cn('h-5 w-5 rounded flex items-center justify-center flex-shrink-0', bg)}>
                <Icon className="h-3 w-3" />
              </span>
              <span className="text-sm text-campus-gray-700">{label}</span>
            </button>
          ))}
        </Dropdown>

        {/* Image */}
        <Btn title="Image" onClick={() => imageInputRef.current?.click()}><ImageIcon className="h-3.5 w-3.5" /></Btn>
        <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ''; }}
        />

        <span className="ml-auto text-xs text-campus-gray-400 flex-shrink-0">
          {charCount.toLocaleString('fr-FR')} car.
        </span>
      </div>

      {/* ── Bubble menu custom (portal, sans dépendance externe) ── */}
      <CustomBubbleMenu editor={editor} />

      {/* ── Zone édition ── */}
      <EditorContent editor={editor} />
    </div>
  );
}
