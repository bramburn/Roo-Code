;<input
	placeholder="Enter command prefix"
	onChange={(event) => {
		console.log("[DEBUG] AllowedCommands input changed. New value:", event.target.value)
		// call the appropriate handler to update allowed commands
		handleAllowedCommandsChange(event.target.value)
	}}
	// ...other props
/>
