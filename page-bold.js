window.addEventListener("message", e => {
	if (!e.data || !e.data.type) return;

	try {
		document.execCommand("styleWithCSS", false, true);

		switch (e.data.type) {
			case "EXT_BOLD_REQUEST":
				document.execCommand("bold");
				break;

			case "EXT_ITALIC_REQUEST":
				document.execCommand("italic");
				break;

			case "EXT_UNDERLINE_REQUEST":
				document.execCommand("underline");
				break;
		}
	} catch (err) {
		console.error("Formatting command failed:", err);
	}
});