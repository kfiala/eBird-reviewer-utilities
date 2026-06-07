// Inject page script so execCommand runs in page context, only in Firefox where content scripts run in an isolated world
if (isFirefox()) {
//	console.log("In Firefox.")
	const script = document.createElement("script");
	script.src = browser.runtime.getURL("page-bold.js");
	document.documentElement.appendChild(script);
	script.remove();

	// Intercept Ctrl-B, -I, or -U inside contenteditable
	document.addEventListener("keydown", e => {
		const t = e.target;
		if (!t || !t.isContentEditable) return;

		if (e.ctrlKey) {
			switch (e.key) {
				case "b":
					e.preventDefault();
					window.postMessage({ type: "EXT_BOLD_REQUEST" }, "*");
					break;
				case "i":
					e.preventDefault();
					window.postMessage({ type: "EXT_ITALIC_REQUEST" }, "*");
					break;
				case "u":
					e.preventDefault();
					window.postMessage({ type: "EXT_UNDERLINE_REQUEST" }, "*");
					break;
			}
		}
	}, { capture: true });
}
// else { console.log("Not in Firefox.") }

function isFirefox() {
	// Modern detection (Chromium-based browsers expose userAgentData)
	if (navigator.userAgentData && navigator.userAgentData.brands) {
		return navigator.userAgentData.brands.some(b => b.brand === "Firefox");
	}

	// Fallback for Firefox (which does not expose userAgentData)
	return navigator.userAgent.includes("Firefox");
}

function isChrome() {
	if (navigator.userAgentData && navigator.userAgentData.brands) {
		return navigator.userAgentData.brands.some(b => b.brand === "Chromium" || b.brand === "Google Chrome");
	}

	return navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Edg");
}