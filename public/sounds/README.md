# Sound Effects

This directory is reserved for optional sound effect files.

## Current Implementation

SG Math Pal uses **Web Audio API synthesis** to generate sound effects programmatically. No external audio files are required. The sound system is implemented in `lib/sounds.ts`.

### Available Sounds (synthesized)

| Sound | Description | Trigger |
|-------|-------------|---------|
| `correct` | Happy ascending tone | Correct answer |
| `incorrect` | Soft low tone | Wrong answer |
| `xpGain` | Quick sparkle | XP earned |
| `levelUp` | Triumphant arpeggio | Tier promotion |
| `streak` | Rising excitement | Streak milestone |
| `challengeStart` | Dramatic intro | Challenge begins |
| `challengePass` | Victory fanfare | Challenge passed |
| `challengeFail` | Sympathetic descend | Challenge failed |
| `badgeUnlock` | Magical chime | Badge earned |
| `click` | Subtle tap | Button click |

## Adding Custom Audio Files (Optional)

If you prefer to use real audio files instead of synthesized sounds:

1. Add your audio files to this directory with these names:
   - `correct.mp3` (or `.wav`, `.ogg`)
   - `incorrect.mp3`
   - `xpGain.mp3`
   - `levelUp.mp3`
   - `streak.mp3`
   - `challengeStart.mp3`
   - `challengePass.mp3`
   - `challengeFail.mp3`
   - `badgeUnlock.mp3`
   - `click.mp3`

2. Update `lib/sounds.ts` to use Howler.js or HTML5 Audio instead of Web Audio API synthesis.

## Benefits of Web Audio API Synthesis

- **No external files to manage** - sounds are generated in code
- **Smaller bundle size** - no audio files to download
- **Instant loading** - no preloading required
- **Easy to customize** - adjust frequencies, durations, and volumes in code
- **No licensing concerns** - entirely original generated sounds
