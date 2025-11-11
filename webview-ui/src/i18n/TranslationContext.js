import { jsx as _jsx } from "react/jsx-runtime"
import { createContext, useContext, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import i18next, { loadTranslations } from "./setup"
import { useExtensionState } from "@/context/ExtensionStateContext"
// Create context for translations
export const TranslationContext = createContext({
	t: (key) => key,
	i18n: i18next,
})
// Translation provider component
export const TranslationProvider = ({ children }) => {
	// Initialize with default configuration
	const { i18n } = useTranslation()
	// Get the extension state directly - it already contains all state properties
	const extensionState = useExtensionState()
	// Load translations once when the component mounts
	useEffect(() => {
		try {
			loadTranslations()
		} catch (error) {
			console.error("Failed to load translations:", error)
		}
	}, [])
	useEffect(() => {
		i18n.changeLanguage(extensionState.language)
	}, [i18n, extensionState.language])
	// Memoize the translation function to prevent unnecessary re-renders
	const translate = useCallback(
		(key, options) => {
			return i18n.t(key, options)
		},
		[i18n],
	)
	return _jsx(TranslationContext.Provider, {
		value: {
			t: translate,
			i18n,
		},
		children: children,
	})
}
// Custom hook for easy translations
export const useAppTranslation = () => useContext(TranslationContext)
export default TranslationProvider
//# sourceMappingURL=TranslationContext.js.map
