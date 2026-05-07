# BlackHat Swipe — Supabase Email Templates

Custom HTML email templates for Supabase Auth. All templates use inline CSS only and are compatible with all major email clients.

---

## Where to paste each template

Go to your Supabase project dashboard:
**Authentication → Email Templates**

| File | Supabase template slot | Purpose |
|---|---|---|
| `confirm-signup.html` | **Confirm signup** | Sent when a new user registers |
| `reset-password.html` | **Reset password** | Sent when user clicks "Forgot password" |
| `magic-link.html` | **Magic Link** | Sent for passwordless login (if enabled) |

For each template:
1. Open the file, select all (`Cmd+A`), copy (`Cmd+C`)
2. In Supabase Dashboard → Authentication → Email Templates → select the slot
3. Paste into the **Body** field (HTML tab, not the plain-text tab)
4. Set the **Subject** line (see suggestions below)
5. Click **Save**

---

## Subject line suggestions

| Template | Subject |
|---|---|
| confirm-signup | `Confirm your BlackHat Swipe account` |
| reset-password | `Reset your BlackHat Swipe password` |
| magic-link | `Your BlackHat Swipe login link` |

---

## Template variables used

All three templates use a single variable:

```
{{ .ConfirmationURL }}
```

Supabase automatically replaces this with the correct signed URL for each email type. Do not change this variable name — it is the same for confirm signup, reset password, and magic link.

---

## How to preview before saving

**Option 1 — Browser preview:**
Open any `.html` file directly in your browser. The `{{ .ConfirmationURL }}` placeholder will be visible as literal text — that's expected. The layout, colors, and typography will render correctly.

**Option 2 — Supabase preview:**
After pasting into the Supabase dashboard body field, click the **Preview** tab (if available in your plan) to see a rendered preview with a dummy URL injected.

**Option 3 — Send a test:**
Supabase Dashboard → Authentication → Email Templates → **Send test email** button. This sends the template to your account email with a real (but safe) confirmation URL.

---

## Design tokens used

| Token | Value |
|---|---|
| Background | `#000000` |
| Card | `#0D0D0D` |
| Border | `#1A1A1A` |
| Accent (yellow) | `#FACC15` |
| Text primary | `#FFFFFF` |
| Text secondary | `#71717a` |
| Text muted | `#3f3f46` |
| Sub-note | `#52525b` |
| Font | `system-ui, -apple-system, sans-serif` |

---

## Notes

- All CSS is inline — no external stylesheets, no web fonts, no images (except emoji)
- Table-based layout for maximum email client compatibility (Gmail, Outlook, Apple Mail)
- The `⚡` emoji in the logo renders in all modern clients; Outlook may show a fallback box — acceptable
- Do not add any tracking pixels or external resources; Supabase may strip them
