#!/bin/bash
# We will use sed to inject settings into AppStore.tsx

# 1. Add imports
sed -i -e '/import { apiService }/a\
import { DirectorSettings } from "../types/settings";\
import { defaultSettings } from "../mocks/defaultSettings";\
' src/store/AppStore.tsx

# 2. Add to AppState interface
sed -i -e '/allTimeline: TimelineEvent\[\];/a\
  settings: DirectorSettings;\
  updateSettings: (newSettings: DirectorSettings) => void;\
  resetSettings: () => void;\
' src/store/AppStore.tsx

# 3. Add to AppProvider component
sed -i -e '/const \[allTimeline, setAllTimeline\] = useState<TimelineEvent\[\]>(\[\]);/a\
  const [settings, setSettings] = useState<DirectorSettings>(() => {\
    const saved = localStorage.getItem("ne_director_settings");\
    if (saved) {\
      try { return JSON.parse(saved); } catch (e) { console.error(e); }\
    }\
    return defaultSettings;\
  });\
\
  useEffect(() => {\
    localStorage.setItem("ne_director_settings", JSON.stringify(settings));\
    \
    if (settings.appearance.theme === "White") {\
      document.documentElement.classList.add("theme-white");\
      document.documentElement.classList.remove("dark");\
    } else if (settings.appearance.theme === "Black") {\
      document.documentElement.classList.remove("theme-white");\
      document.documentElement.classList.add("dark");\
    } else {\
      if (window.matchMedia("(prefers-color-scheme: light)").matches) {\
        document.documentElement.classList.add("theme-white");\
        document.documentElement.classList.remove("dark");\
      } else {\
        document.documentElement.classList.remove("theme-white");\
        document.documentElement.classList.add("dark");\
      }\
    }\
  }, [settings]);\
\
  const updateSettings = (newSettings: DirectorSettings) => {\
    setSettings(newSettings);\
  };\
\
  const resetSettings = () => {\
    setSettings(defaultSettings);\
  };\
' src/store/AppStore.tsx

# 4. Add to Provider value
sed -i -e 's/projects, people, attentionItems, allTimeline,/projects, people, attentionItems, allTimeline, settings, updateSettings, resetSettings,/g' src/store/AppStore.tsx
