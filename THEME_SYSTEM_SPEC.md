# PawTraceQR Theming System Specification

## Overview
A comprehensive theming system allowing users to customize their pet profile pages and application interface while maintaining accessibility standards.

## 1. Theme Categories

### 1.1 Nature Theme
**Concept:** Earthy, organic colors inspired by the outdoors
- **Primary Color:** Forest Green (#2d5016)
- **Secondary Color:** Sky Blue (#4a90a4)
- **Accent Color:** Sunflower Yellow (#f4c430)
- **Background:** Cream (#faf8f3)
- **Text:** Dark Forest (#1a2f0f)

**Best For:** Outdoor pets, adventurous animals, nature lovers

### 1.2 Playful Theme
**Concept:** Bright, energetic colors that evoke fun and joy
- **Primary Color:** Vibrant Orange (#ff6b35)
- **Secondary Color:** Electric Blue (#00b4d8)
- **Accent Color:** Hot Pink (#ff006e)
- **Background:** Light Peach (#fff3e6)
- **Text:** Deep Navy (#1b263b)

**Best For:** Young pets, energetic animals, fun-loving owners

### 1.3 Elegant Theme
**Concept:** Sophisticated, refined colors for a premium feel
- **Primary Color:** Deep Purple (#5a189a)
- **Secondary Color:** Rose Gold (#b76e79)
- **Accent Color:** Gold (#d4af37)
- **Background:** Soft Ivory (#f8f5f2)
- **Text:** Charcoal (#2b2d42)

**Best For:** Show pets, elegant breeds, sophisticated owners

### 1.4 Ocean Theme
**Concept:** Calming blues and aquatic colors
- **Primary Color:** Deep Ocean (#023e8a)
- **Secondary Color:** Turquoise (#06aed5)
- **Accent Color:** Coral (#ff6b9d)
- **Background:** Seafoam (#caf0f8)
- **Text:** Deep Sea (#03045e)

**Best For:** Calm pets, water-loving animals, peaceful aesthetic

### 1.5 Minimalist Theme
**Concept:** Clean, simple monochrome with subtle accents
- **Primary Color:** Slate Gray (#475569)
- **Secondary Color:** Cool Gray (#94a3b8)
- **Accent Color:** Mint Green (#10b981)
- **Background:** Pure White (#ffffff)
- **Text:** Almost Black (#0f172a)

**Best For:** Modern aesthetic, professional look, clean design

## 2. Customization Options

### 2.1 Pet Page Customization
Users can customize per-pet or globally:

**Header/Hero Section:**
- Background color/gradient
- Text color
- Badge colors

**Information Cards:**
- Card background color
- Card border color
- Text color
- Icon colors

**Status Badge (Missing/Safe):**
- Badge background colors
- Badge text colors

**Custom Options:**
- Upload custom background image
- Adjust transparency/overlay
- Font size preferences

### 2.2 Application UI Customization
Applies to the entire authenticated user experience:

**Navigation:**
- Header background
- Link colors
- Active state colors

**Buttons:**
- Primary button colors
- Secondary button colors
- Hover states

**Cards & Components:**
- Card backgrounds
- Border colors
- Shadow intensity

**Forms:**
- Input field colors
- Focus states
- Error/success colors

### 2.3 Dark Mode Variations
Each theme includes auto-generated dark mode with:
- Inverted background colors
- Adjusted contrast ratios
- Preserved brand colors
- Enhanced readability

## 3. Implementation Approach

### 3.1 Access Points

**Primary Location:** Account Settings
- Navigate to `/account`
- New "Appearance" tab alongside profile settings
- Visual theme gallery with preview cards
- "Customize" button for advanced options

**Quick Access:**
- Theme switcher icon in header (for quick light/dark toggle)
- Per-pet theme selector in pet edit dialog

### 3.2 Theme Storage Structure

**Database Schema:**
```sql
-- User-level theme preferences
CREATE TABLE user_themes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  theme_preset VARCHAR(50), -- 'nature', 'playful', 'elegant', 'ocean', 'minimalist', 'custom'
  custom_colors JSONB, -- Stores custom color overrides
  dark_mode_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pet-level theme overrides (optional)
CREATE TABLE pet_themes (
  pet_id UUID PRIMARY KEY REFERENCES pets(id),
  theme_preset VARCHAR(50),
  custom_colors JSONB,
  background_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Custom Colors JSON Structure:**
```json
{
  "primary": "#2d5016",
  "secondary": "#4a90a4",
  "accent": "#f4c430",
  "background": "#faf8f3",
  "text": "#1a2f0f",
  "cardBg": "#ffffff",
  "cardBorder": "#e5e7eb",
  "buttonPrimary": "#2d5016",
  "buttonSecondary": "#4a90a4"
}
```

## 4. User Experience Flow

### 4.1 Theme Selection Flow

**Step 1: Discovery**
- User navigates to Account → Appearance
- Sees gallery of 5 preset themes with preview cards
- Each card shows: theme name, color palette, example pet card

**Step 2: Preview**
- Click on any theme card
- Right panel opens with live preview
- Shows pet page mockup with selected theme
- Toggle between light/dark mode preview

**Step 3: Customization (Optional)**
- Click "Customize Colors" button
- Color picker modal opens
- Adjust individual color values
- Real-time preview updates
- Accessibility warnings if contrast is insufficient

**Step 4: Application**
- Choose scope: "All Pets" or "This Pet Only"
- Click "Apply Theme"
- Instant visual update across application
- Success notification confirms changes

**Step 5: Reset**
- Option to "Reset to Default" at any time
- Confirmation dialog prevents accidental resets

### 4.2 Quick Actions
- **Quick Light/Dark Toggle:** Icon in header for instant mode switch
- **Theme Badge:** Small indicator showing current theme in settings
- **Import/Export:** Share theme JSON with other users

## 5. Technical Considerations

### 5.1 Performance Optimization

**CSS Custom Properties:**
```css
:root {
  --color-primary: #2d5016;
  --color-secondary: #4a90a4;
  --color-accent: #f4c430;
  --color-background: #faf8f3;
  --color-text: #1a2f0f;
}
```

**Implementation Strategy:**
- Use CSS variables for instant theme switching
- No page reload required
- Minimal re-renders
- Cached in localStorage for persistence

**Loading Strategy:**
- Theme loads from localStorage immediately (prevents flash)
- Database sync happens in background
- Optimistic UI updates

### 5.2 Accessibility Compliance

**WCAG 2.1 AA Standards:**
- Normal text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

**Built-in Safeguards:**
- Automatic contrast checker when customizing
- Warning indicators for poor contrast
- Suggested alternatives when accessibility fails
- Force override requires confirmation

**Color Blindness Support:**
- All themes tested with CVD simulators
- Not solely dependent on color for meaning
- Icons and labels accompany color indicators

### 5.3 Cross-Device Consistency

**Responsive Design:**
- Themes adapt to screen size
- Mobile-optimized color picker
- Touch-friendly customization interface

**Sync Across Devices:**
- Theme stored in database (user_themes table)
- Syncs automatically when user logs in
- localStorage cache for offline support

### 5.4 Public Pet Page Themes

**Implementation:**
- Pet themes stored separately (pet_themes table)
- Public viewers see pet owner's chosen theme
- No authentication required to view themed pages
- Edge-cached for performance

**Privacy Considerations:**
- Only color values are public
- No personal information in theme data
- Custom background images use CDN

## 6. Migration Path

### Phase 1: Foundation (Current)
- Create database schema
- Build theme constants and utilities
- Implement CSS variable system

### Phase 2: UI Components (Current)
- Theme selector component
- Color picker with accessibility checker
- Preview component

### Phase 3: Integration (Current)
- Account settings integration
- Pet page theme application
- Header theme toggle

### Phase 4: Enhancement (Future)
- Custom background images
- Font customization
- Advanced gradient options
- Theme marketplace (share themes)

## 7. Success Metrics

**User Engagement:**
- % of users who customize themes
- Average time spent in theme settings
- Most popular theme choices

**Accessibility:**
- % of custom themes passing WCAG AA
- Contrast checker usage rate
- Override frequency

**Performance:**
- Theme switch latency (<100ms target)
- Page load impact (<50ms target)
- Database query performance

## 8. Future Enhancements

**Premium Features:**
- Gradient backgrounds
- Custom fonts
- Animated elements
- Pattern overlays

**Social Features:**
- Share themes with friends
- Theme marketplace
- Featured community themes
- Seasonal theme collections

**AI Features:**
- AI-suggested themes based on pet breed
- Photo-to-theme color extraction
- Automatic contrast optimization
