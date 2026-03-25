import { For, Show } from 'solid-js'
import { SUBJECTS } from '@/lib/constants'

interface FilterProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedSubjects: Array<string>
  onSubjectToggle: (subject: string) => void
  onClearSubjects: () => void
}

export function Filter(props: FilterProps) {
  return (
    <div class="mb-6 flex flex-col gap-4">
      <div class="form-control w-full">
        <label class="input-bordered input flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            class="h-4 w-4 opacity-70"
          >
            <path
              fill-rule="evenodd"
              d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
              clip-rule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by title or author..."
            class="grow"
            value={props.searchQuery}
            onInput={(e) => props.onSearchChange(e.currentTarget.value)}
          />
        </label>
      </div>

      <div>
        <div class="mb-2 flex items-center justify-between">
          <span class="text-sm font-semibold text-base-content/80">
            Filter by Subjects
          </span>
          <Show when={props.selectedSubjects.length > 0}>
            <button
              class="btn text-error btn-ghost btn-xs"
              onClick={props.onClearSubjects}
            >
              Clear
            </button>
          </Show>
        </div>
        <div class="flex flex-wrap gap-2">
          <For each={SUBJECTS}>
            {(subject) => {
              const isSelected = () => props.selectedSubjects.includes(subject)
              return (
                <button
                  class={`badge cursor-pointer badge-lg transition-colors ${
                    isSelected() ? 'badge-primary' : 'badge-soft'
                  }`}
                  onClick={() => props.onSubjectToggle(subject)}
                >
                  {subject}
                </button>
              )
            }}
          </For>
        </div>
      </div>
    </div>
  )
}
