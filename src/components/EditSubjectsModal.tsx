import { createSignal } from 'solid-js'
import { setSubjects } from '@/server/subject.functions'

const SUBJECT_OPTIONS = [
  'Math',
  'Physics',
  'Biology',
  'Chemistry',
  'English',
  'History',
  'Geography',
  'Computer Science',
]

export function EditSubjectsModal(props: {
  open: boolean
  subjects: string[]
  onClose: () => void
  onSaveSuccess: (subjects: string[]) => void
}) {
  const [selected, setSelected] = createSignal<string[]>([...props.subjects])
  const [saving, setSaving] = createSignal(false)

  function toggleSubject(subject: string) {
    setSelected((curr) =>
      curr.includes(subject)
        ? curr.filter((s) => s !== subject)
        : curr.length < 10
          ? [...curr, subject]
          : curr,
    )
  }

  async function handleSave(e: Event) {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await setSubjects({ data: { subjects: selected() } })
      props.onSaveSuccess(response.subjects)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div class={`modal ${props.open ? 'modal-open' : ''}`}>
      <div class="modal-box">
        <h3 class="mb-2 text-lg font-bold">Edit Preferred Subjects</h3>
        <form onSubmit={handleSave} class="flex flex-col gap-2">
          <div class="flex flex-wrap gap-2">
            {SUBJECT_OPTIONS.map((subject) => (
              <label class="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  class="checkbox checkbox-primary"
                  checked={selected().includes(subject)}
                  onInput={() => toggleSubject(subject)}
                  disabled={
                    !selected().includes(subject) && selected().length >= 10
                  }
                />
                <span>{subject}</span>
              </label>
            ))}
          </div>
          <div class="modal-action mt-4">
            <button
              type="button"
              class="btn btn-ghost btn-sm"
              onClick={props.onClose}
              disabled={saving()}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-sm btn-primary"
              disabled={saving()}
            >
              Save
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" onClick={props.onClose}></div>
    </div>
  )
}
