import { EventEmitter } from "events";
/**
 * Manual review manager for context review workflow
 * Handles timeout management and fallback logic
 */
export class ManualReviewManager extends EventEmitter {
    timeoutDuration; // 5 minutes default
    contextFileManager;
    fileWatcher;
    currentState = "idle";
    currentContextFile;
    timeoutTimer;
    startTime;
    constructor(timeoutDuration = 5 * 60 * 1000, // 5 minutes in milliseconds
    contextFileManager, fileWatcher) {
        super();
        this.timeoutDuration = timeoutDuration;
        this.contextFileManager = contextFileManager;
        this.fileWatcher = fileWatcher;
        // Listen for file changes
        this.fileWatcher.on("fileChange", this.handleFileChange.bind(this));
    }
    /**
     * Start manual review process
     */
    async startManualReview(messages, metadata) {
        if (this.currentState !== "idle") {
            throw new Error("Manual review already in progress");
        }
        // Create context file
        const contextFile = await this.contextFileManager.createContextFile(messages, metadata);
        this.currentContextFile = contextFile;
        this.currentState = "waiting";
        this.startTime = Date.now();
        // Start timeout timer
        this.startTimeoutTimer();
        const status = {
            state: "waiting",
            contextFile,
            startTime: this.startTime,
            remainingTime: this.timeoutDuration,
            timeoutDuration: this.timeoutDuration,
        };
        // Emit status change
        this.emit("statusChange", status);
        console.log(`ManualReviewManager: Started manual review for ${contextFile}`);
        return contextFile;
    }
    /**
     * Handle file change during review
     */
    handleFileChange(event) {
        if (this.currentState === "waiting" && event.filepath === this.currentContextFile) {
            // File was modified, complete the review
            this.completeReview("completed");
        }
    }
    /**
     * Complete manual review
     */
    completeReview(reason) {
        if (this.currentState === "idle") {
            return;
        }
        // Clear timeout timer
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = undefined;
        }
        const endTime = Date.now();
        const duration = this.startTime ? endTime - this.startTime : 0;
        this.currentState = "idle";
        this.currentContextFile = undefined;
        this.startTime = undefined;
        const status = {
            state: reason,
            contextFile: this.currentContextFile,
            timeoutDuration: this.timeoutDuration,
        };
        // Emit status change
        this.emit("statusChange", status);
        this.emit("reviewComplete", { reason, contextFile: this.currentContextFile, duration });
        console.log(`ManualReviewManager: Review completed with reason: ${reason} (duration: ${duration}ms)`);
    }
    /**
     * Start timeout timer
     */
    startTimeoutTimer() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
        }
        let remainingTime = this.timeoutDuration;
        const updateTimer = () => {
            remainingTime -= 1000; // Update every second
            if (remainingTime <= 0) {
                // Timeout reached
                this.completeReview("timeout");
                return;
            }
            const status = {
                state: "waiting",
                contextFile: this.currentContextFile,
                startTime: this.startTime,
                remainingTime,
                timeoutDuration: this.timeoutDuration,
            };
            // Emit status update with remaining time
            this.emit("statusChange", status);
        };
        // Update immediately and then set interval
        updateTimer();
        this.timeoutTimer = setInterval(updateTimer, 1000);
    }
    /**
     * Force fallback to intelligent compression
     */
    async forceFallback() {
        if (this.currentState === "idle") {
            return;
        }
        this.completeReview("fallback");
    }
    /**
     * Get current review status
     */
    getStatus() {
        const remainingTime = this.currentState === "waiting" && this.startTime
            ? Math.max(0, this.timeoutDuration - (Date.now() - this.startTime))
            : 0;
        return {
            state: this.currentState,
            contextFile: this.currentContextFile,
            startTime: this.startTime,
            remainingTime,
            timeoutDuration: this.timeoutDuration,
        };
    }
    /**
     * Check if review is active
     */
    isActive() {
        return this.currentState !== "idle";
    }
    /**
     * Cleanup resources
     */
    dispose() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = undefined;
        }
        this.fileWatcher.removeAllListeners();
        this.removeAllListeners();
        this.currentState = "idle";
        this.currentContextFile = undefined;
        this.startTime = undefined;
    }
}
//# sourceMappingURL=manual-review.js.map