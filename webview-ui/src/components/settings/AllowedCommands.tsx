import React from "react"
import { useExtensionState } from "../../context/ExtensionStateContext"

interface AllowedCommandsProps {
	value: string
	onChange: (value: string) => void
}

export const AllowedCommands: React.FC<AllowedCommandsProps> = ({ value, onChange }) => {
	const { setAllowedCommands } = useExtensionState()

	return (
		<input
			placeholder="Enter command prefix"
			value={value}
			onChange={(event) => {
				console.log("[DEBUG] AllowedCommands input changed. New value:", event.target.value)
				onChange(event.target.value)
				setAllowedCommands([event.target.value])
			}}
		/>
	)
}
