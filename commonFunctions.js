function getOptions(optionSet) {
	let options = JSON.parse(localStorage.getItem(optionSet));
	if (options == null)
		options = {};
	return options;
}

function setOption(optionSet, optionName, optionValue) {
	let options = getOptions(optionSet);
	options[optionName] = optionValue;
	localStorage.setItem(optionSet, JSON.stringify(options));
}