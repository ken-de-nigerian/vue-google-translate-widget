# Usage Examples

## Basic Setup

### Minimal Implementation

```vue
<script setup lang="ts">
import { GoogleTranslateWidget } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'
</script>

<template>
  <div id="app">
    <GoogleTranslateWidget />
  </div>
</template>
```

### With Custom Languages

```vue
<script setup lang="ts">
import { GoogleTranslateWidget } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'
</script>

<template>
  <GoogleTranslateWidget 
    default-language="en"
    :included-languages="['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh-CN']"
  />
</template>
```

## Advanced Examples

### Custom Styling

```vue
<script setup lang="ts">
import { GoogleTranslateWidget } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'
</script>

<template>
  <GoogleTranslateWidget 
    title="Choose Your Language"
    subtitle="We speak your language!"
    search-placeholder="Find your language..."
  />
</template>

<style>
/* Custom button color */
.gtw-float-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}

/* Custom modal border radius */
.gtw-modal {
  border-radius: 2rem !important;
}

/* Custom active language color */
.gtw-language-active {
  background: rgba(102, 126, 234, 0.1) !important;
  border-color: rgba(102, 126, 234, 0.5) !important;
}
</style>
```

### Using the Composable Directly

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useGoogleTranslate } from 'vue-google-translate-widget'

const {
  currentLanguage,
  isChangingLanguage,
  languages,
  changeLanguage,
  initializeTranslate
} = useGoogleTranslate({
  defaultLanguage: 'en',
  includedLanguages: ['en', 'es', 'fr', 'de']
})

const selectedLang = ref('en')

onMounted(() => {
  initializeTranslate()
  selectedLang.value = currentLanguage.value
})

const handleChange = () => {
  changeLanguage(selectedLang.value)
}
</script>

<template>
  <div>
    <select v-model="selectedLang" @change="handleChange" :disabled="isChangingLanguage">
      <option v-for="lang in languages" :key="lang.code" :value="lang.code">
        {{ lang.nativeName }}
      </option>
    </select>
    <p v-if="isChangingLanguage">Changing language...</p>
    <!-- Hidden Google Translate Element -->
    <div id="google_translate_element" style="display: none"></div>
  </div>
</template>
```

### Using the Button Component

```vue
<script setup lang="ts">
import { GoogleTranslateButton } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'

const handleLanguageChange = (lang: string) => {
  console.log('Language changed to:', lang)
  // Send analytics event, update user preferences, etc.
}
</script>

<template>
  <nav>
    <div class="logo">My App</div>
    <GoogleTranslateButton 
      button-text="🌍 Language"
      :included-languages="['en', 'es', 'fr', 'de', 'it']"
      @language-changed="handleLanguageChange"
    />
  </nav>
</template>

<style scoped>
nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}
</style>
```

### Integration with Navbar

```vue
<script setup lang="ts">
import { GoogleTranslateButton } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'
</script>

<template>
  <header>
    <nav class="navbar">
      <div class="nav-brand">
        <img src="/logo.svg" alt="Logo" />
        <span>MyApp</span>
      </div>
      
      <ul class="nav-links">
        <li><a href="#home">Home</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      
      <div class="nav-actions">
        <GoogleTranslateButton 
          button-text="Language"
          button-class="custom-translate-btn"
        />
        <button class="btn-primary">Get Started</button>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-links a {
  text-decoration: none;
  color: #374151;
  font-weight: 500;
}

.nav-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-primary {
  padding: 0.5rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
}
</style>
```

### Dark Mode Support

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GoogleTranslateWidget } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'

const isDark = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value
}
</script>

<template>
  <div :class="{ 'dark-mode': isDark }">
    <button @click="toggleDark">Toggle Dark Mode</button>
    <GoogleTranslateWidget />
  </div>
</template>

<style>
/* Light mode (default) */
:root {
  --bg-color: white;
  --text-color: #111827;
  --border-color: #e5e7eb;
}

/* Dark mode */
.dark-mode {
  --bg-color: #1f2937;
  --text-color: #f9fafb;
  --border-color: #374151;
}

.dark-mode .gtw-modal {
  background: var(--bg-color) !important;
  border-color: var(--border-color) !important;
}

.dark-mode .gtw-modal-title,
.dark-mode .gtw-language-native {
  color: var(--text-color) !important;
}

.dark-mode .gtw-search-input {
  background: #374151 !important;
  border-color: #4b5563 !important;
  color: var(--text-color) !important;
}

.dark-mode .gtw-language-item {
  border-color: var(--border-color) !important;
}

.dark-mode .gtw-language-item:hover {
  background: #374151 !important;
}
</style>
```

### With Analytics Tracking

```vue
<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useGoogleTranslate } from 'vue-google-translate-widget'

const { currentLanguage, initializeTranslate } = useGoogleTranslate()

// Track language changes
watch(currentLanguage, (newLang, oldLang) => {
  if (oldLang && newLang !== oldLang) {
    // Send to Google Analytics
    if (window.gtag) {
      window.gtag('event', 'language_change', {
        previous_language: oldLang,
        new_language: newLang
      })
    }
    
    // Or send to custom analytics
    trackLanguageChange(oldLang, newLang)
  }
})

const trackLanguageChange = (from: string, to: string) => {
  console.log(`Language changed from ${from} to ${to}`)
  // Your custom tracking logic
}

onMounted(() => {
  initializeTranslate()
})
</script>

<template>
  <div id="google_translate_element" style="display: none"></div>
</template>
```

### Full Featured Example

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { GoogleTranslateWidget } from 'vue-google-translate-widget'
import 'vue-google-translate-widget/dist/style.css'

const userPreferences = ref({
  language: 'en',
  theme: 'light'
})

// Save preferences to localStorage
watch(() => userPreferences.value.language, (newLang) => {
  localStorage.setItem('preferred-language', newLang)
})

// Load preferences on mount
onMounted(() => {
  const savedLang = localStorage.getItem('preferred-language')
  if (savedLang) {
    userPreferences.value.language = savedLang
  }
})

const popularLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh-CN']
</script>

<template>
  <div class="app">
    <header>
      <h1>Welcome to My App</h1>
      <p>Experience our app in your language</p>
    </header>
    
    <main>
      <section class="hero">
        <h2>Choose Your Language</h2>
        <p>We support over 100 languages worldwide</p>
      </section>
      
      <GoogleTranslateWidget 
        :default-language="userPreferences.language"
        :included-languages="popularLanguages"
        title="Select Your Language"
        subtitle="Choose from our most popular languages"
      />
    </main>
  </div>
</template>

<style>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
}

header {
  text-align: center;
  margin-bottom: 3rem;
}

.hero {
  text-align: center;
  margin-bottom: 2rem;
}
</style>
```

## TypeScript Examples

### Type-Safe Language Handling

```typescript
import { ref, type Ref } from 'vue'
import { useGoogleTranslate, type Language } from 'vue-google-translate-widget'

interface UserSettings {
  language: string
  region: string
  notifications: boolean
}

const settings = ref<UserSettings>({
  language: 'en',
  region: 'US',
  notifications: true
})

const { 
  currentLanguage, 
  languages,
  changeLanguage 
} = useGoogleTranslate()

const updateLanguage = (langCode: string): void => {
  settings.value.language = langCode
  changeLanguage(langCode)
}

const getLanguageByCode = (code: string): Language | undefined => {
  return languages.find(lang => lang.code === code)
}
```

## Common Patterns

### Conditional Language Widget

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { GoogleTranslateWidget } from 'vue-google-translate-widget'

const showTranslate = ref(false)
const userCountry = ref('US')

// Only show for non-English countries
if (userCountry.value !== 'US') {
  showTranslate.value = true
}
</script>

<template>
  <GoogleTranslateWidget v-if="showTranslate" />
</template>
```

### Language Persistence

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useGoogleTranslate } from 'vue-google-translate-widget'

const { currentLanguage, changeLanguage, initializeTranslate } = useGoogleTranslate()

onMounted(() => {
  initializeTranslate()
  
  // Check if user has a preferred language in their profile
  const userProfile = getUserProfile() // Your API call
  if (userProfile?.preferredLanguage && 
      userProfile.preferredLanguage !== currentLanguage.value) {
    changeLanguage(userProfile.preferredLanguage)
  }
})

const getUserProfile = () => {
  // Your logic to get user profile
  return { preferredLanguage: 'es' }
}
</script>
```