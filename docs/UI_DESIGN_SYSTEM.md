# UI design system

The midnight-violet tokens in `app/globals.css` stay the source of color, type, radius, and motion.

| Token | Value |
|---|---|
| Background | `#080817` |
| Sidebar | `#0D0D20` |
| Surface | `#111126` |
| Raised | `#17172F` |
| Violet | `#8B5CF6` |
| Bright violet | `#A78BFA` |
| Text | `#F8F7FF` |
| Muted text | `#A4A3BF` |
| Positive | `#36D6A0` |
| Negative | `#FB7185` |
| Warning | `#F4BB64` |

Body type is Inter. Headings are Plus Jakarta Sans. Addresses and ETH figures use JetBrains Mono, and the body uses tabular numerals.

Spacing for the new page footer is 16px above the rule and 12px between controls. Control height is 36px. Radius is 10px on pager buttons and 18px on panels. Focus uses a 2px bright-violet outline.

`PremiumPagination` is the only page footer. It is omitted when there are zero rows so the empty state is the message.
