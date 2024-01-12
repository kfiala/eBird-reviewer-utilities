
if (window.location.href.includes('https://review.ebird.org/admin/search.htm')) {
	let inputs = document.querySelectorAll(".form-inputs");
	inputs.forEach(noPadding);	// Remove excess padding around form elements

	setupButton();	// Set up the option settings button

	// Prefill county, state, country from saved values, if any
	let geography = localStorage.getItem('geography');
	if (geography) {
		geography = JSON.parse(geography);
		document.getElementById('countyName').value = geography.county;	// Fill in form fields
		document.getElementById('stateProvince').value = geography.state;
		let select = document.getElementById('countryCode');
		let option;
		for (let i = 0; i < select.options.length; i++) {
			option = select.options[i];
			if (option.value == geography.country) {
				option.selected = true;
				break;
			}
		}
	} else {	// Set form fields to blank
		document.getElementById('countyName').value = '';
		document.getElementById('stateProvince').value = '';
		document.querySelector('#countryCode').value = '';
	}
}

function noPadding(input, index) {	// Remove padding
	input.style.padding = 0;
}

function setupButton() {	// Set up the "Add-on settings" button
	let pageTitle = document.getElementById('screentitle');
	let button = document.createElement('div');	// Div to serve as button
	button.style.display = 'inline-block';
	button.style.marginTop = '10px';
	button.append('Add-on settings');
	pageTitle.append(button);

	let optionDiv = document.createElement('div');	// Div to hold the pull-down menu
	optionDiv.setAttribute('id', 'Koptions');
	optionDiv.style.border = 'thin solid blue';
	optionDiv.style.width = '15em';
	optionDiv.style.marginLeft = '4em';
	pageTitle.append(optionDiv);
	optionDiv.style.display = 'none';

	let choicesList = document.createElement('ul')	// List options
	choicesList.style.listStyle = 'none';
	choicesList.style.marginLeft = '2px';
	choicesList.style.marginBottom = 0;
	choicesList.style.fontWeight = '700';
	choicesList.style.fontSize = '.88rem';
	let choicesListColor = "#00609a";
	choicesList.style.color = choicesListColor;

	let selectedBackgroundColor = '#113245';
	let BackgroundColor = '#F0F6FA';

	let stickyToggleButton = document.createElement('li');	// Button for sticky geography option
	stickyToggleButton.setAttribute('id', 'StickyBId');
	if (localStorage.getItem('geoSticky')) {	// Geography is not sticky
		stickyToggleButton.textContent = 'Enable sticky geography';
		document.querySelector('#formactions').getElementsByTagName('input')[0].removeEventListener('click', geographyCapture);
	} else {	// Geography is sticky.
		stickyToggleButton.textContent = 'Disable sticky geography';
		// Listener on submit button collects county, state, country
		document.querySelector('#formactions').getElementsByTagName('input')[0].addEventListener('click', geographyCapture);
	}

	choicesList.append(stickyToggleButton);	// append li to ul
	optionDiv.append(choicesList);				// append ul to div
	pageTitle.append(optionDiv);					// append div to div

	stickyToggleButton.addEventListener('mouseenter', () => {
		stickyToggleButton.style.backgroundColor = selectedBackgroundColor, stickyToggleButton.style.color = 'white';
	});
	stickyToggleButton.addEventListener('mouseleave', () => {
		stickyToggleButton.style.backgroundColor = BackgroundColor, stickyToggleButton.style.color = choicesListColor;
	});

	stickyToggleButton.addEventListener('click', () => {	// button in pull-down was clicked
		document.getElementById('Koptions').style.display = 'none';	// Hide the pull-down
		toggleItem('geoSticky');
	});

	button.addEventListener('click', (ev) => {	// 'Add-on settings' button was clicked
		ev.stopPropagation();
		document.getElementById('Koptions').style.display = 'block';	// Show the popup menu
		// Close the pop up on a click anywhere
		window.addEventListener('click', () => { document.getElementById('Koptions').style.display = 'none' }, { once: true });
	})
}

function toggleItem(item) {	// Turn a toggle option on or off
	let onoff;
	if (localStorage.getItem(item)) {
		localStorage.removeItem(item);
		onoff = 'on';
	} else {
		localStorage.setItem(item, 'off');
		onoff = 'off';
	}
	if (item == 'geoSticky') {
		let button = document.getElementById('StickyBId');
		if (onoff == 'off') {	// geography is being disabled
			button.textContent = 'Enable sticky geography';	// Label for next time
			localStorage.removeItem('geography');
			document.querySelector('#formactions').getElementsByTagName('input')[0].removeEventListener('click', geographyCapture);
			// Set form fields to blank
			document.getElementById('countyName').value = '';
			document.getElementById('stateProvince').value = '';
			document.querySelector('#countryCode').value = '';
		} else {	// geography is being enabled
			button.textContent = 'Disable sticky geography';	// Label for next time
			document.querySelector('#formactions').getElementsByTagName('input')[0].addEventListener('click', geographyCapture);
		}
	}
}

function geographyCapture() {	// Save the geography values
	let county = document.getElementById('countyName').value;
	let state = document.getElementById('stateProvince').value;
	let country = document.querySelector('#countryCode').value;
	const geography = { county: county, state: state, country: country };
	localStorage.setItem('geography', JSON.stringify(geography));
}