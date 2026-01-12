# Hugeicons Icon Name Mappings

This file documents the correct Hugeicons icon names to use in the codebase.

## Key Rules:
1. All Hugeicons exports have the `Icon` suffix
2. Most icons have numbered variants (`01`, `02`, etc.)
3. Use the `01` variant as default unless specified otherwise

## Icon Mappings (Wrong → Correct)

### Already Correct (just need Icon suffix):
- `Sparkles` → `SparklesIcon` ✓
- `Lock` → `LockIcon` ✓
- `View` → `ViewIcon` ✓
- `Moon` → `MoonIcon` ✓
- `Sun` → `SunIcon` ✓
- `Fire` → `FireIcon` ✓
- `Flash` → `FlashIcon` ✓
- `Clock` → `ClockIcon` ✓
- `CreditCard` → `CreditCardIcon` ✓
- `Grid` → `GridIcon` ✓
- `Video` → `VideoIcon` ✓
- `Pencil` → `PencilIcon` ✓

### Need Icon suffix + 01 variant:
- `Add` → `Add01Icon`
- `Alert` → `Alert01Icon`
- `Search` → `Search01Icon`
- `Upload` → `Upload01Icon`
- `Settings` → `Settings01Icon`
- `Remove` → `Remove01Icon`
- `Calendar` → `Calendar01Icon`
- `Document` → `DocumentAttachmentIcon` (special - no numbered variant)
- `ArrowRight` → `ArrowRight01Icon`
- `ArrowLeft` → `ArrowLeft01Icon`
- `ArrowDown` → `ArrowDown01Icon`
- `Link` → `Link01Icon`
- `Image01` → `Image01Icon` (already has 01 in name)
- `BarChart` → `BarChartIcon` (no 01 variant)
- `PencilEdit` → `PencilEdit01Icon`
- `Delete` → `Delete01Icon`
- `Menu` → `Menu01Icon`
- `More` → `More01Icon`

### Special Cases:
- `Cancel` → `Cancel01Icon`
- `CancelCircle` → `CancelCircleIcon` ✓
- `Tick` → `Tick01Icon`
- `TickDouble` → `TickDouble01Icon`
- `AlertCircle` → `AlertCircleIcon` ✓
- `AlertTriangle` → `Alert01Icon` (use Alert instead)
- `InformationCircle` → `InformationCircleIcon` ✓
- `Loading` → `Loading01Icon`
- `Loader` → `Loading01Icon` (use Loading)
- `Loader2` → `Loading01Icon` (use Loading)
- `Check` → `Tick01Icon` (use Tick)
- `XCircle` → `CancelCircleIcon` (use CancelCircle)
- `UserMultiple` → `UserMultipleIcon` ✓
- `MoreHorizontal` → `MoreHorizontalIcon` ✓
- `MoreVertical` → `MoreVerticalIcon` ✓
- `Grid3X3` → `GridIcon` (use Grid)
- `List` → `Menu01Icon` (use Menu)
- `ExternalLink` → `Link01Icon` (use Link)
- `ChevronDown` → `ChevronDownIcon` ✓
- `ChevronLeft` → `ChevronLeftIcon` ✓
- `ChevronRight` → `ChevronRightIcon` ✓
- `GridView` → `GridViewIcon` ✓
- `UserIcon` → Correct as is ✓
- `SearchIcon` → Correct as is ✓
- `ArrowRightIcon` → Correct as is ✓

## Full Icon List Available

Total icons in @hugeicons-pro/core-solid-rounded: **4,661 icons**

See `/tmp/all_hugeicons.txt` for complete list of available icons.

## Common Icon Categories:

### Navigation
- ArrowLeft01Icon, ArrowRight01Icon, ArrowUp01Icon, ArrowDown01Icon
- ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon

### Actions
- Add01Icon, Remove01Icon, Delete01Icon
- Edit01Icon, PencilEdit01Icon
- Upload01Icon, Download01Icon
- Search01Icon, Filter01Icon

### Status
- Tick01Icon, TickDouble01Icon
- Cancel01Icon, CancelCircleIcon
- Alert01Icon, AlertCircleIcon
- InformationCircleIcon, QuestionCircleIcon

### UI Elements
- Menu01Icon, MoreHorizontalIcon, MoreVerticalIcon
- GridIcon, GridViewIcon, List01Icon
- Settings01Icon, UserIcon

### Time & Calendar
- Calendar01Icon, Clock01Icon
- Time01Icon, Schedule01Icon

### Media
- Image01Icon, VideoIcon, CameraIcon
- Play01Icon, Pause01Icon

### Social
- ShareIcon, Like01Icon, Comment01Icon
- UserIcon, UserMultipleIcon, UserAdd01Icon

### Files & Documents
- DocumentAttachmentIcon, FolderIcon, FileIcon
- CloudIcon, Download01Icon, Upload01Icon
