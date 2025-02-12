import CryptoJS from "crypto-js"

// Encryption key (should be dynamically generated or retrieved securely)
const ENCRYPTION_KEY = "SECRET29kd9k29dajjalisdjaoisjd88a4s835e5fsd18h9t6sc111v5bdrf5" // In production, use a secure method to generate this

export const storageUtils = {
	// Encrypted storage methods
	setItem: (key: string, value: string) => {
		try {
			const encryptedValue = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString()
			localStorage.setItem(key, encryptedValue)
		} catch (error) {
			console.error("Storage write error:", error)
		}
	},

	getItem: (key: string): string | null => {
		try {
			const encryptedValue = localStorage.getItem(key)
			if (!encryptedValue) return null

			const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY)
			return decryptedBytes.toString(CryptoJS.enc.Utf8)
		} catch (error) {
			console.error("Storage read error:", error)
			return null
		}
	},

	removeItem: (key: string) => {
		localStorage.removeItem(key)
	},

	// Migration and versioning utilities
	migrateStorage: (migrations: Record<string, (oldData: any) => any>) => {
		const storageVersion = localStorage.getItem("storageVersion")

		Object.entries(migrations).forEach(([version, migrationFn]) => {
			if (!storageVersion || version > storageVersion) {
				const keys = Object.keys(localStorage)
				keys.forEach((key) => {
					const item = localStorage.getItem(key)
					if (item) {
						try {
							const parsedItem = JSON.parse(item)
							const migratedItem = migrationFn(parsedItem)
							localStorage.setItem(key, JSON.stringify(migratedItem))
						} catch (error) {
							console.error(`Migration error for key ${key}:`, error)
						}
					}
				})

				localStorage.setItem("storageVersion", version)
			}
		})
	},

	// Backup and recovery
	createBackup: (key: string) => {
		const data = localStorage.getItem(key)
		if (data) {
			localStorage.setItem(`backup_${key}_${Date.now()}`, data)
		}
	},

	restoreFromBackup: (backupKey: string) => {
		const backupData = localStorage.getItem(backupKey)
		if (backupData) {
			const originalKey = backupKey.replace(/^backup_/, "").replace(/_\d+$/, "")
			localStorage.setItem(originalKey, backupData)
		}
	},
}
