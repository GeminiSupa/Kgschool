# Card Colors Update Guide

## Color Scheme
- **Blue** (`card-blue`): General/Information cards
- **Green** (`card-green`): Success/Reports cards
- **Purple** (`card-purple`): Special/Important cards
- **Orange** (`card-orange`): Lunch/Food related cards
- **Pink** (`card-pink`): Children related cards
- **Teal** (`card-teal`): Staff/HR related cards
- **Yellow** (`card-yellow`): Warning/Attention cards
- **Indigo** (`card-indigo`): Default cards

## Usage
Replace `bg-white` or `card-fiori` with:
- `card-fiori card-blue` for blue cards
- `card-fiori card-green` for green cards
- etc.

Or use the Card component with color prop:
```vue
<Card color="pink" title="Children">...</Card>
```
