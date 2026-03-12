import { For } from 'solid-js'
import { SUBJECTS } from '@/lib/constants'

interface InfoHubFilterProps {
  value: string
  onChange: (value: string) => void
}

export function InfoHubFilter(props: InfoHubFilterProps) {
  return (
    <div class="mb-4">
      <select
        class="select-bordered select w-full max-w-xs"
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
      >
        <option value="All">All Subjects</option>
        <For each={SUBJECTS}>
          {(subject) => <option value={subject}>{subject}</option>}
        </For>
      </select>
    </div>
  )
}
