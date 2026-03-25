import { createEffect, onCleanup, onMount } from 'solid-js'
import { type JSX } from 'solid-js'
import EasyMDE from 'easymde'
import 'easymde/dist/easymde.min.css'

interface MarkdownEditorProps {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  options?: Partial<EasyMDE.Options>
}

export function MarkdownEditor(props: MarkdownEditorProps): JSX.Element {
  let textareaRef: HTMLTextAreaElement | undefined
  let editor: EasyMDE | undefined

  onMount(() => {
    if (!textareaRef) return

    editor = new EasyMDE({
      element: textareaRef,
      initialValue: props.value,
      placeholder: props.placeholder,
      ...props.options,
    })

    editor.codemirror.on('change', () => {
      props.onChange(editor!.value())
    })
  })

  createEffect(() => {
    if (editor && editor.value() !== props.value) {
      editor.value(props.value)
    }
  })

  onCleanup(() => {
    editor?.toTextArea()
    editor = undefined
  })

  return <textarea ref={(el) => (textareaRef = el)} />
}
