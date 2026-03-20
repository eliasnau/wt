# Members V2 Table Scroll Fix (Simple)

Use this pattern to keep page width stable and make only the table area scroll horizontally on mobile.

## 1) Clamp page/container width

- Parent page wrapper: `w-full min-w-0 overflow-x-hidden`
- Table host wrapper: `w-full min-w-0 overflow-hidden`

This prevents the full page from becoming wider than the viewport.

## 2) Make only table area scroll

- Table card/container: `w-full min-w-0 max-w-[calc(100dvw-2rem)] overflow-hidden sm:max-w-full`
- Inner scroller: `w-full max-w-full overflow-x-auto overscroll-x-contain`
- Inner width holder: `min-w-[1040px]`

This keeps a readable table width and enables horizontal scrolling only inside the table block.

## 3) Keep controls aligned

- Put footer controls inside the same width holder as the table
- Use one-line footer layout when needed:
  - `flex items-center justify-between gap-2`

This keeps table + footer aligned during horizontal scroll.

## 4) If small wiggle appears

- Avoid raw viewport clamps like `max-w-screen`
- Use `max-w-[calc(100dvw-2rem)]` (or match your real page padding)

The `2rem` matches typical `px-4` page padding (left + right).
