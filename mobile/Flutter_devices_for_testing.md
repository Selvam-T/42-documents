# Mobile Piscine Project Checklist:  
### Can I Test on Web Without USB Pass-through?

## Overall answer

Yes — you can continue developing and testing these projects on **web target** without USB pass-through to a physical device.

Best fit:
- **Module 0**: yes
- **Module 1**: yes
- **Module 2**: mostly yes, but **GPS requirement is the risk**
- **Module 3**: mostly yes, but inherits the **GPS/geolocation risk** from Module 2
- **Module 4**: yes
- **Module 5**: yes

## Practical verdict by module

| Module | Project | Web target usable? | Notes |
|---|---|---:|---|
| 0 | Calculator / basic Flutter exercises | Yes | UI, responsiveness, button logic, debug prints, expression handling can all be tested in browser. |
| 1 | Weather app structure and logic | Yes | Tabs, search field, geolocation button behavior, responsiveness, text updates can be tested on web. |
| 2 | Weather app with API + geolocation | Partial yes | Search, API calls, suggestions, tab persistence, error handling are fine on web. The weak point is the subject wording requiring **device GPS** and forbidding external geolocation API. |
| 3 | Advanced weather app design | Partial yes | Design, background, current/today/weekly layouts, charts, lists, suggestions are fine on web. But this module continues Module 2, so GPS compliance is still the main uncertainty. |
| 4 | Diary app auth + database | Yes | Login flow, Google/GitHub auth, create/read/delete entries, protected routes, database updates can be tested on web. |
| 5 | Advanced diary app profile + agenda | Yes | Login, profile page, realtime updates, calendar page, entry selection/deletion can be tested on web. |

## What web testing is good enough for

You can use web for:
- layout and responsiveness
- navigation and tabs
- forms and search fields
- button behavior
- API integration
- auth flow testing
- database CRUD testing
- charts and lists
- error states and empty states

## What web testing does **not** fully replace

You still do **not** fully test:
- Android device installation flow
- Android permission UX exactly as it appears on phone
- real physical-device GPS behavior
- mobile-only platform quirks
- APK deployment on an actual phone

## Important caution for Modules 2 and 3

The project text says geolocation must use the **device's GPS**, and says you **must not use an external API for geolocation**.

That means:
- browser geolocation is useful for development
- browser geolocation may be enough to demonstrate the flow
- but it is the **least safe area** if an evaluator interprets the subject strictly as requiring actual mobile-device GPS behavior

So for Modules 2 and 3:
- **web is fine for day-to-day progress**
- **web-only is not the strongest compliance position**

## Best development target right now

Prefer this during development:

```bash
flutter run -d chrome
```

Use this only when needed:

```bash
flutter run -d web-server --web-port 8080 --web-hostname 0.0.0.0
```

Reason:
- `chrome` gives a better normal web dev workflow
- `web-server` works, but debugging support is more limited

## Recommendation based on your host restrictions

Since your host does not allow USB pass-through and you do not have sudo rights:

1. Continue on **web target** for all modules.
2. Treat **Modules 0, 1, 4, and 5** as safely web-testable.
3. Treat **Modules 2 and 3** as web-testable for most features, but keep in mind the GPS caveat.
4. If later you gain access to your own machine, VM setup, or another host with USB access, re-check only the geolocation flow on a real device.

## Final classification

- **Web-safe:** Modules 0, 1, 4, 5
- **Web-safe for most work, but risky on strict GPS interpretation:** Modules 2, 3
- **Blocked by lack of USB pass-through:** none for development, only some real-device validation

## Bottom line

You are **not blocked** from continuing these projects.

You can make solid progress and test almost everything on web.
Your only meaningful gap is **true device-GPS validation** for the weather app path in **Modules 2 and 3**.
