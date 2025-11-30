import { ref, computed, type Ref } from 'vue'

export interface Language {
  name: string
  nativeName: string
  code: string
  flag: string
}

export interface UseGoogleTranslateOptions {
  defaultLanguage?: string
  languages?: Language[]
  includedLanguages?: string[]
  autoDisplay?: boolean
}

export interface UseGoogleTranslateReturn {
  currentLanguage: Ref<string>
  isChangingLanguage: Ref<boolean>
  languages: Language[]
  changeLanguage: (lang: string) => void
  initializeTranslate: () => void
  getCurrentLanguage: () => string
}

declare global {
  interface Window {
    google: any
    googleTranslateElementInit: () => void
  }
}

const DEFAULT_LANGUAGES: Language[] = [
  { name: 'Afrikaans', nativeName: 'Afrikaans', code: 'af', flag: 'za' },
  { name: 'Albanian', nativeName: 'Shqip', code: 'sq', flag: 'al' },
  { name: 'Amharic', nativeName: 'አማርኛ', code: 'am', flag: 'et' },
  { name: 'Arabic', nativeName: 'العربية', code: 'ar', flag: 'sa' },
  { name: 'Armenian', nativeName: 'Հայերեն', code: 'hy', flag: 'am' },
  { name: 'Azerbaijani', nativeName: 'Azərbaycan', code: 'az', flag: 'az' },
  { name: 'Basque', nativeName: 'Euskara', code: 'eu', flag: 'es' },
  { name: 'Belarusian', nativeName: 'Беларуская', code: 'be', flag: 'by' },
  { name: 'Bengali', nativeName: 'বাংলা', code: 'bn', flag: 'bd' },
  { name: 'Bosnian', nativeName: 'Bosanski', code: 'bs', flag: 'ba' },
  { name: 'Bulgarian', nativeName: 'Български', code: 'bg', flag: 'bg' },
  { name: 'Catalan', nativeName: 'Català', code: 'ca', flag: 'es' },
  { name: 'Cebuano', nativeName: 'Cebuano', code: 'ceb', flag: 'ph' },
  { name: 'Chinese (Simplified)', nativeName: '中文 (简体)', code: 'zh-CN', flag: 'cn' },
  { name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', code: 'zh-TW', flag: 'tw' },
  { name: 'Corsican', nativeName: 'Corsu', code: 'co', flag: 'fr' },
  { name: 'Croatian', nativeName: 'Hrvatski', code: 'hr', flag: 'hr' },
  { name: 'Czech', nativeName: 'Čeština', code: 'cs', flag: 'cz' },
  { name: 'Danish', nativeName: 'Dansk', code: 'da', flag: 'dk' },
  { name: 'Dutch', nativeName: 'Nederlands', code: 'nl', flag: 'nl' },
  { name: 'English', nativeName: 'English', code: 'en', flag: 'gb' },
  { name: 'Esperanto', nativeName: 'Esperanto', code: 'eo', flag: 'eu' },
  { name: 'Estonian', nativeName: 'Eesti', code: 'et', flag: 'ee' },
  { name: 'Finnish', nativeName: 'Suomi', code: 'fi', flag: 'fi' },
  { name: 'French', nativeName: 'Français', code: 'fr', flag: 'fr' },
  { name: 'Frisian', nativeName: 'Frysk', code: 'fy', flag: 'nl' },
  { name: 'Galician', nativeName: 'Galego', code: 'gl', flag: 'es' },
  { name: 'Georgian', nativeName: 'ქართული', code: 'ka', flag: 'ge' },
  { name: 'German', nativeName: 'Deutsch', code: 'de', flag: 'de' },
  { name: 'Greek', nativeName: 'Ελληνικά', code: 'el', flag: 'gr' },
  { name: 'Gujarati', nativeName: 'ગુજરાતી', code: 'gu', flag: 'in' },
  { name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', code: 'ht', flag: 'ht' },
  { name: 'Hausa', nativeName: 'Hausa', code: 'ha', flag: 'ng' },
  { name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', code: 'haw', flag: 'us' },
  { name: 'Hebrew', nativeName: 'עברית', code: 'he', flag: 'il' },
  { name: 'Hindi', nativeName: 'हिन्दी', code: 'hi', flag: 'in' },
  { name: 'Hmong', nativeName: 'Hmoob', code: 'hmn', flag: 'la' },
  { name: 'Hungarian', nativeName: 'Magyar', code: 'hu', flag: 'hu' },
  { name: 'Icelandic', nativeName: 'Íslenska', code: 'is', flag: 'is' },
  { name: 'Igbo', nativeName: 'Igbo', code: 'ig', flag: 'ng' },
  { name: 'Indonesian', nativeName: 'Bahasa Indonesia', code: 'id', flag: 'id' },
  { name: 'Irish', nativeName: 'Gaeilge', code: 'ga', flag: 'ie' },
  { name: 'Italian', nativeName: 'Italiano', code: 'it', flag: 'it' },
  { name: 'Japanese', nativeName: '日本語', code: 'ja', flag: 'jp' },
  { name: 'Javanese', nativeName: 'Basa Jawa', code: 'jv', flag: 'id' },
  { name: 'Kannada', nativeName: 'ಕನ್ನಡ', code: 'kn', flag: 'in' },
  { name: 'Kazakh', nativeName: 'Қазақ', code: 'kk', flag: 'kz' },
  { name: 'Khmer', nativeName: 'ខ្មែរ', code: 'km', flag: 'kh' },
  { name: 'Kinyarwanda', nativeName: 'Kinyarwanda', code: 'rw', flag: 'rw' },
  { name: 'Korean', nativeName: '한국어', code: 'ko', flag: 'kr' },
  { name: 'Kurdish', nativeName: 'Kurdî', code: 'ku', flag: 'iq' },
  { name: 'Kyrgyz', nativeName: 'Кыргызча', code: 'ky', flag: 'kg' },
  { name: 'Lao', nativeName: 'ລາວ', code: 'lo', flag: 'la' },
  { name: 'Latin', nativeName: 'Latina', code: 'la', flag: 'va' },
  { name: 'Latvian', nativeName: 'Latviešu', code: 'lv', flag: 'lv' },
  { name: 'Lithuanian', nativeName: 'Lietuvių', code: 'lt', flag: 'lt' },
  { name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', code: 'lb', flag: 'lu' },
  { name: 'Macedonian', nativeName: 'Македонски', code: 'mk', flag: 'mk' },
  { name: 'Malagasy', nativeName: 'Malagasy', code: 'mg', flag: 'mg' },
  { name: 'Malay', nativeName: 'Bahasa Melayu', code: 'ms', flag: 'my' },
  { name: 'Malayalam', nativeName: 'മലയാളം', code: 'ml', flag: 'in' },
  { name: 'Maltese', nativeName: 'Malti', code: 'mt', flag: 'mt' },
  { name: 'Maori', nativeName: 'Māori', code: 'mi', flag: 'nz' },
  { name: 'Marathi', nativeName: 'मराठी', code: 'mr', flag: 'in' },
  { name: 'Mongolian', nativeName: 'Монгол', code: 'mn', flag: 'mn' },
  { name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ', code: 'my', flag: 'mm' },
  { name: 'Nepali', nativeName: 'नेपाली', code: 'ne', flag: 'np' },
  { name: 'Norwegian', nativeName: 'Norsk', code: 'no', flag: 'no' },
  { name: 'Nyanja (Chichewa)', nativeName: 'Chichewa', code: 'ny', flag: 'mw' },
  { name: 'Odia (Oriya)', nativeName: 'ଓଡ଼ିଆ', code: 'or', flag: 'in' },
  { name: 'Pashto', nativeName: 'پښتو', code: 'ps', flag: 'af' },
  { name: 'Persian', nativeName: 'فارسی', code: 'fa', flag: 'ir' },
  { name: 'Polish', nativeName: 'Polski', code: 'pl', flag: 'pl' },
  { name: 'Portuguese', nativeName: 'Português', code: 'pt', flag: 'pt' },
  { name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', code: 'pa', flag: 'in' },
  { name: 'Romanian', nativeName: 'Română', code: 'ro', flag: 'ro' },
  { name: 'Russian', nativeName: 'Русский', code: 'ru', flag: 'ru' },
  { name: 'Samoan', nativeName: 'Samoa', code: 'sm', flag: 'ws' },
  { name: 'Scots Gaelic', nativeName: 'Gàidhlig', code: 'gd', flag: 'gb' },
  { name: 'Serbian', nativeName: 'Српски', code: 'sr', flag: 'rs' },
  { name: 'Sesotho', nativeName: 'Sesotho', code: 'st', flag: 'ls' },
  { name: 'Shona', nativeName: 'Shona', code: 'sn', flag: 'zw' },
  { name: 'Sindhi', nativeName: 'سنڌي', code: 'sd', flag: 'pk' },
  { name: 'Sinhala', nativeName: 'සිංහල', code: 'si', flag: 'lk' },
  { name: 'Slovak', nativeName: 'Slovenčina', code: 'sk', flag: 'sk' },
  { name: 'Slovenian', nativeName: 'Slovenščina', code: 'sl', flag: 'si' },
  { name: 'Somali', nativeName: 'Soomaali', code: 'so', flag: 'so' },
  { name: 'Spanish', nativeName: 'Español', code: 'es', flag: 'es' },
  { name: 'Sundanese', nativeName: 'Basa Sunda', code: 'su', flag: 'id' },
  { name: 'Swahili', nativeName: 'Kiswahili', code: 'sw', flag: 'tz' },
  { name: 'Swedish', nativeName: 'Svenska', code: 'sv', flag: 'se' },
  { name: 'Tagalog (Filipino)', nativeName: 'Tagalog', code: 'tl', flag: 'ph' },
  { name: 'Tajik', nativeName: 'Тоҷикӣ', code: 'tg', flag: 'tj' },
  { name: 'Tamil', nativeName: 'தமிழ்', code: 'ta', flag: 'in' },
  { name: 'Tatar', nativeName: 'Татар', code: 'tt', flag: 'ru' },
  { name: 'Telugu', nativeName: 'తెలుగు', code: 'te', flag: 'in' },
  { name: 'Thai', nativeName: 'ไทย', code: 'th', flag: 'th' },
  { name: 'Turkish', nativeName: 'Türkçe', code: 'tr', flag: 'tr' },
  { name: 'Turkmen', nativeName: 'Türkmençe', code: 'tk', flag: 'tm' },
  { name: 'Ukrainian', nativeName: 'Українська', code: 'uk', flag: 'ua' },
  { name: 'Urdu', nativeName: 'اردو', code: 'ur', flag: 'pk' },
  { name: 'Uyghur', nativeName: 'ئۇيغۇر', code: 'ug', flag: 'cn' },
  { name: 'Uzbek', nativeName: 'Oʻzbek', code: 'uz', flag: 'uz' },
  { name: 'Vietnamese', nativeName: 'Tiếng Việt', code: 'vi', flag: 'vn' },
  { name: 'Welsh', nativeName: 'Cymraeg', code: 'cy', flag: 'gb-wls' },
  { name: 'Xhosa', nativeName: 'isiXhosa', code: 'xh', flag: 'za' },
  { name: 'Yiddish', nativeName: 'ייִדיש', code: 'yi', flag: 'il' },
  { name: 'Yoruba', nativeName: 'Yorùbá', code: 'yo', flag: 'ng' },
  { name: 'Zulu', nativeName: 'isiZulu', code: 'zu', flag: 'za' },
]

export function useGoogleTranslate(options: UseGoogleTranslateOptions = {}): UseGoogleTranslateReturn {
  const {
    defaultLanguage = 'en',
    languages = DEFAULT_LANGUAGES,
    includedLanguages,
    autoDisplay = false,
  } = options

  const currentLanguage = ref('en')
  const isChangingLanguage = ref(false)

  // Filter languages if includedLanguages is provided
  const filteredLanguages = includedLanguages
    ? languages.filter(lang => includedLanguages.includes(lang.code))
    : languages

  const getCurrentLanguage = (): string => {
    // Check URL hash first
    const hash = window.location.hash
    if (hash && hash.includes('googtrans')) {
      const match = hash.match(/googtrans\([^|]+\|([^)]+)\)/)
      if (match && match[1]) {
        return match[1]
      }
    }

    // Check cookies
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      const parts = cookie.trim().split('=')
      if (parts[0] === 'googtrans') {
        const value = decodeURIComponent(parts[1])
        const langParts = value.split('/')
        if (langParts.length >= 3 && langParts[2]) {
          return langParts[2]
        }
      }
    }

    return defaultLanguage
  }

  const loadGoogleTranslateScript = (): void => {
    if (document.getElementById('google-translate-script')) return

    const script = document.createElement('script')
    script.id = 'google-translate-script'
    script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    script.async = true
    document.head.appendChild(script)

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: defaultLanguage,
          includedLanguages: filteredLanguages.map(lang => lang.code).join(','),
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay,
        },
        'google_translate_element'
      )
    }
  }

  const changeLanguage = (lang: string): void => {
    if (isChangingLanguage.value) return

    isChangingLanguage.value = true

    // Clear existing cookies
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`

    if (lang === defaultLanguage) {
      currentLanguage.value = defaultLanguage
      location.reload()
      return
    }

    // Set new language cookies
    const cookieValue = `/${defaultLanguage}/${lang}`
    document.cookie = `googtrans=${cookieValue}; path=/`
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`

    currentLanguage.value = lang

    // Trigger Google Translate change
    const googleTranslateComboBox = document.querySelector('.goog-te-combo') as HTMLSelectElement
    if (googleTranslateComboBox) {
      googleTranslateComboBox.value = lang
      googleTranslateComboBox.dispatchEvent(new Event('change'))

      setTimeout(() => {
        location.reload()
      }, 300)
    } else {
      location.reload()
    }
  }

  const initializeTranslate = (): void => {
    currentLanguage.value = getCurrentLanguage()
    loadGoogleTranslateScript()

    // Check if Google Translate is ready and apply saved language
    const checkTranslateReady = setInterval(() => {
      const googleTranslateComboBox = document.querySelector('.goog-te-combo') as HTMLSelectElement
      if (googleTranslateComboBox) {
        clearInterval(checkTranslateReady)

        const detectedLang = getCurrentLanguage()
        if (detectedLang !== defaultLanguage && googleTranslateComboBox.value !== detectedLang) {
          googleTranslateComboBox.value = detectedLang
          googleTranslateComboBox.dispatchEvent(new Event('change'))
        }
      }
    }, 100)

    setTimeout(() => clearInterval(checkTranslateReady), 5000)
  }

  return {
    currentLanguage,
    isChangingLanguage,
    languages: filteredLanguages,
    changeLanguage,
    initializeTranslate,
    getCurrentLanguage,
  }
}