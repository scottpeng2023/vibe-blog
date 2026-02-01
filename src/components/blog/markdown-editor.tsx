'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { useEffect } from 'react'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Code,
  Undo,
  Redo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null
  }

  const buttons = [
    {
      icon: <Heading1 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive('heading', { level: 1 }),
      title: 'H1',
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
      title: 'H2',
    },
    {
      icon: <Bold className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      title: '加粗',
    },
    {
      icon: <Italic className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      title: '斜体',
    },
    {
      icon: <List className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      title: '无序列表',
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      title: '有序列表',
    },
    {
      icon: <Quote className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
      title: '引用',
    },
    {
      icon: <Code className="h-4 w-4" />,
      onClick: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive('codeBlock'),
      title: '代码块',
    },
  ]

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50 rounded-t-lg">
      {buttons.map((btn, i) => (
        <Button
          key={i}
          variant={btn.isActive ? 'secondary' : 'ghost'}
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            btn.onClick()
          }}
          title={btn.title}
          className="h-8 w-8 p-0"
        >
          {btn.icon}
        </Button>
      ))}
      <div className="ml-auto flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().undo().run()
          }}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.preventDefault()
            editor.chain().focus().redo().run()
          }}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export const MarkdownEditor = ({ value, onChange }: MarkdownEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: false,
        breaks: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // 获取 Markdown 内容并传回父组件
      const markdown = (editor.storage as any).markdown.getMarkdown()
      onChange(markdown)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  })

  // 当外部 value 改变时更新编辑器（例如编辑文章加载数据时）
  useEffect(() => {
    if (editor && value !== (editor.storage as any).markdown.getMarkdown()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  return (
    <div className="w-full border rounded-lg overflow-hidden bg-background">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
