function getOptions(optionSet) {
	let options = JSON.parse(localStorage.getItem(optionSet));
	let initialize = false;
	if (options == null)
		options = {};
	if ('howmany' in options == false) {
		options.howmany = '25';
		initialize = true;
	}
	if (initialize) {
		localStorage.setItem(optionSet, JSON.stringify(options));
	}
	return options;
}

function setOption(optionSet, optionName, optionValue) {
	let options = getOptions(optionSet);
	options[optionName] = optionValue;
	localStorage.setItem(optionSet, JSON.stringify(options));
}