import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime"
import { useMemo, useRef, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { CheckpointMenu } from "./CheckpointMenu"
import { checkpointSchema } from "./schema"
import { GitCommitVertical } from "lucide-react"
export const CheckpointSaved = ({ checkpoint, currentHash, ...props }) => {
	const { t } = useTranslation()
	const isCurrent = currentHash === props.commitHash
	const [isPopoverOpen, setIsPopoverOpen] = useState(false)
	const [isClosing, setIsClosing] = useState(false)
	const closeTimer = useRef(null)
	useEffect(() => {
		return () => {
			if (closeTimer.current) {
				window.clearTimeout(closeTimer.current)
				closeTimer.current = null
			}
		}
	}, [])
	const handlePopoverOpenChange = (open) => {
		setIsPopoverOpen(open)
		if (open) {
			setIsClosing(false)
			if (closeTimer.current) {
				window.clearTimeout(closeTimer.current)
				closeTimer.current = null
			}
		} else {
			setIsClosing(true)
			closeTimer.current = window.setTimeout(() => {
				setIsClosing(false)
				closeTimer.current = null
			}, 200) // keep menu visible briefly to avoid popover jump
		}
	}
	const menuVisible = isPopoverOpen || isClosing
	const metadata = useMemo(() => {
		if (!checkpoint) {
			return undefined
		}
		const result = checkpointSchema.safeParse(checkpoint)
		if (!result.success) {
			return undefined
		}
		return result.data
	}, [checkpoint])
	if (!metadata) {
		return null
	}
	return _jsxs("div", {
		className: "group flex items-center justify-between gap-2 pt-2 pb-3 ",
		children: [
			_jsxs("div", {
				className: "flex items-center gap-2 text-blue-400 whitespace-nowrap",
				children: [
					_jsx(GitCommitVertical, { className: "w-4" }),
					_jsx("span", { className: "font-semibold", children: t("chat:checkpoint.regular") }),
					isCurrent &&
						_jsxs("span", { className: "text-muted", children: ["(", t("chat:checkpoint.current"), ")"] }),
				],
			}),
			_jsx("span", {
				className: "block w-full h-[2px] mt-[2px] text-xs",
				style: {
					backgroundImage:
						"linear-gradient(90deg, rgba(0, 188, 255, .65), rgba(0, 188, 255, .65) 80%, rgba(0, 188, 255, 0) 99%)",
				},
			}),
			_jsx("div", {
				"data-testid": "checkpoint-menu-container",
				className: cn("h-4 -mt-2", menuVisible ? "block" : "hidden group-hover:block"),
				children: _jsx(CheckpointMenu, {
					ts: props.ts,
					commitHash: props.commitHash,
					checkpoint: metadata,
					onOpenChange: handlePopoverOpenChange,
				}),
			}),
		],
	})
}
//# sourceMappingURL=CheckpointSaved.js.map
