# German Kindergarten (Kita) Features Plan

## Current Issue
The system currently has school-level features (courses, assignments, exams, timetables) which are NOT appropriate for German kindergartens.

## What German Kindergartens Actually Use

### 1. **Activities** (Aktivitäten) ✅ Already exists
- Group activities and programs
- Photos and documentation
- Activity types (crafts, outdoor, music, etc.)

### 2. **Observations** (Beobachtungen) ❌ Need to add
- Teacher observations of children
- Development notes
- Behavior documentation
- Photos/videos attached

### 3. **Daily Reports** (Tagesberichte) ❌ Need to add
- What happened today in the group
- Activities done
- Special events
- Photos from the day
- Shared with parents

### 4. **Development Documentation** (Entwicklungsdokumentation) ❌ Need to add
- Milestone tracking
- Skills development
- Individual child progress
- Age-appropriate goals

### 5. **Portfolios** (Portfolios) ❌ Need to add
- Collection of child's work
- Photos of activities
- Artwork
- Progress over time
- Shared with parents

### 6. **Daily Routines** (Tagesablauf) ❌ Need to add (replace timetables)
- Morning circle
- Free play
- Meal times
- Nap/rest times
- Outdoor time
- Pick-up time
- NOT class schedules like schools

### 7. **Learning Areas/Themes** (Bildungsbereiche/Themen) ❌ Need to add (replace courses)
- Themes like: Nature, Art, Music, Movement, Language
- NOT subjects like Math, Science
- Project-based learning themes
- Can span multiple days/weeks

### 8. **Nap/Rest Times** (Ruhezeiten) ❌ Need to add
- Track which children napped
- Duration
- Notes

## Features to REMOVE/REPLACE

### ❌ Remove:
- **Courses** → Replace with **Learning Themes/Areas**
- **Assignments** → Remove (kindergartens don't give homework)
- **Exams** → Remove (no tests in kindergarten)
- **Timetables** → Replace with **Daily Routines**

## Features to ADD

### ✅ Add:
1. **Observations** - Teacher observations of individual children
2. **Daily Reports** - Group daily reports with photos
3. **Development Documentation** - Child development tracking
4. **Portfolios** - Child portfolio collection
5. **Daily Routines** - Daily schedule/routine (not class schedule)
6. **Learning Themes** - Project themes (not courses)
7. **Nap/Rest Tracking** - Rest time documentation

## Database Schema Changes Needed

### New Tables:
1. `observations` - Teacher observations
2. `daily_reports` - Group daily reports
3. `development_docs` - Development documentation
4. `portfolios` - Child portfolios
5. `daily_routines` - Daily routine schedule
6. `learning_themes` - Learning themes/projects
7. `nap_records` - Nap/rest time tracking

### Tables to Remove/Deprecate:
- `courses` → Replace with `learning_themes`
- `assignments` → Remove
- `exams` → Remove
- `timetables` → Replace with `daily_routines`
- `submissions` → Remove (no assignments = no submissions)

## Implementation Priority

### Phase 1: Remove School Features
1. Remove courses, assignments, exams, timetables from admin dashboard
2. Remove related pages and stores
3. Archive or remove database tables (or mark as deprecated)

### Phase 2: Add Kindergarten Features
1. Create observations system
2. Create daily reports system
3. Create development documentation
4. Create portfolios
5. Create daily routines (replace timetables)
6. Create learning themes (replace courses)
7. Add nap/rest tracking

### Phase 3: Update UI
1. Update admin dashboard with new features
2. Update teacher dashboard
3. Update parent dashboard
4. Remove school-related navigation

## German Kindergarten Workflow

### Typical Day:
1. **Morning Circle** (Morgenkreis) - Greeting, songs, planning
2. **Free Play** (Freispiel) - Children choose activities
3. **Snack Time** (Zwischenmahlzeit)
4. **Outdoor Time** (Draußenzeit)
5. **Lunch** (Mittagessen) - Already implemented ✅
6. **Nap/Rest** (Ruhezeit) - Need to add
7. **Afternoon Activities** - Need to add
8. **Pick-up** (Abholung)

### Documentation:
- Teachers document activities and observations
- Daily reports shared with parents
- Portfolios updated regularly
- Development milestones tracked

## Next Steps

1. Review and approve this plan
2. Create database schema for new features
3. Remove/deprecate school features
4. Implement kindergarten-appropriate features
5. Update all UI and navigation
