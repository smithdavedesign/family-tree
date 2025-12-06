import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Link as LinkIcon } from 'lucide-react';

const StoryEditor = ({ content, onChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            const json = editor.getJSON();
            onChange(json);
        },
    });

    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200">
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-slate-200' : ''}`}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200' : ''}`}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-200' : ''}`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('orderedList') ? 'bg-slate-200' : ''}`}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-slate-300 mx-1" />

                <button
                    onClick={setLink}
                    className={`p-2 rounded hover:bg-slate-200 ${editor.isActive('link') ? 'bg-slate-200' : ''}`}
                    title="Add Link"
                >
                    <LinkIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent
                editor={editor}
                className="prose max-w-none p-4 min-h-[300px] focus:outline-none"
            />
        </div>
    );
};

export default StoryEditor;
