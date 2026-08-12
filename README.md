# e2e standup poster

## `Empty`

`src/Empty.tsx` is a muted, de-emphasized placeholder for sections that have
nothing to show (e.g. an empty "Blockers" or "Today" list on the standup
card). It has no dependency on other components.

### Props

| Prop    | Type     | Default  | Description                                             |
| ------- | -------- | -------- | -------------------------------------------------------- |
| `label` | `string` | `'None'` | Text to render instead of the default `"None"` placeholder. |

```ts
interface EmptyProps {
  label?: string
}
```

### Usage

```tsx
<Empty label="No blockers" />
```

Renders:

```html
<span class="text-sm text-gray-400">No blockers</span>
```

## Build

Running `npm ci && npm run build` builds the project and writes `dist/index.html`.
