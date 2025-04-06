"use strict";
// Provides several conveniences for the traditional review queue page.
const focusColor = '#eeddbb', greenBackground = '#ccf3b4';
const boxBackgroundColor = '#edf4fe', itemBackgroundColor = '#113245';
const flagBackgroundColor = '#bb2222';

if (window.location.href.includes('https://review.ebird.org/admin/review')) {  // matches review.htm, reviewObs.htm, and reviewSub.htm

	var lookup = [];	// global
	var listOfSpecies = [];
	var focusRow, focusRowNumber, numRows = 0, mouseRow = 0, firstDisplayedRow, lastDisplayedRow;

	cssAdjustments();

	formListener();	// If there is a form, set up a submit listener to capture posted data.

	rowsPerPage();		// Setup to listen for rows per page change; set saved option

	//
	// Check if we have listnav, and if so get its webring element.
	// This will be true for regular review (normal or exotic) but not for history or submission review
	//
	let Fwebring = '';
	if (document.getElementById("listnav")) {
		Fwebring = document.getElementById("listnav").querySelector('.webring');
	}

	if (Fwebring) {	// If we are in regular review queue window
		regularReview();
	} else if (location.pathname == '/admin/reviewObs.htm') {	// History window
		historyWindow();
	} else if (location.pathname == '/admin/reviewSub.htm') {	// Submission window
		submissionWindow();
	}
}
///////////	End of mainline code

function cssAdjustments() {	// Adjust the widths of "Review decision", "Reason", and "Notes" inputs
	//
	// Establish whether we are in review mode or exotics mode, or neither.
	// Review mode includes both regular review (review.htm) and history review (reviewObs.htm)
	// Both review queue and search results can be either review or exotics.
	//
	let reviewMode = '';
	let reviewForm = document.getElementById('reviewForm');
	if (reviewForm) {
		let span = document.getElementsByClassName('reviewmode-current')[0];
		if (span) {
			reviewMode = span.textContent;	// "Review mode" or "Exotics mode"
		}
	}

	switch (reviewMode) {
		case 'Exotics mode':
			document.getElementById('newExoticCategory').style = 'width:125px';
			break;
		case 'Review mode':
			document.getElementById('resultingValid').style = 'width:160px';
			document.getElementById('reasonCode').style = 'width:300px';
			break;
		default:
	}
	//	Unfortunately reviewSub.htm is coded incorrectly with two instances of id="notes" so we have to use name= instead of id= to find the notes fields.
	let notesList = document.getElementsByName('notes');
	if (notesList) {
		for (let i = 0; i < notesList.length; i++) {
			notesList[i].style = 'width:300px';
		}
	}
	// Adjust background of Change button when in focus
	let changeButton = document.getElementsByClassName('inputsubmit');
	if (changeButton.length) {
		changeButton[changeButton.length - 1].addEventListener('focus', (ev) => {
			ev.target.style.background = '#0d0';
			// If select species is in effect, some rows are hidden. If shift-click is used on the displayed list,
			// it will select hidden as well as displayed records. Here we look for hidden records that are checked,
			// and uncheck them.
			document.getElementById('contents').querySelectorAll('input.checkbox').forEach(function (input) {
				if (input.parentElement.parentElement.style.display == 'none' && input.checked) {	// Checked hidden record
					input.checked = false;
				}
			});
		});
		changeButton[changeButton.length - 1].addEventListener('blur', (ev) => {
			ev.target.style.background = '#090';
		});
		changeButton[changeButton.length - 1].addEventListener('click', () => {
			sessionStorage.setItem('focusRowNumber', 0);
		});
	}
}

function formListener() {	// If there is a form, set up a submit listener to capture posted data.
	if (document.getElementById('reviewForm')) {
		document.querySelector('#reviewForm').addEventListener('submit', (e) => {
			// This function runs on an update submit, to capture the submitted data.
			const data = new FormData(e.target);
			let observation = data.getAll('obsIds').toString().split(',');
			let obsList = [];
			for (let obs = 0; obs < observation.length; obs++) {
				obsList.push(observation[obs] + '/' + lookup[observation[obs]]);
			}

			let commaList = obsList.join();
			storeRecallHistory(commaList);
		});
	}
}

function rowsPerPage() {
	if (document.getElementById('howmany')) {
		let searchString = new URLSearchParams(location.search);
		let parmValue = searchString.get("rowsPerPage");
		if (!parmValue) {
			let select = document.getElementById('howmany');
			let selection = select.selectedIndex;
			let optionValue = select.options[selection];
			let options = getOptions('reviewerOptions');
			let storedValue = options.howmany;
			if (storedValue) {
				if (storedValue != optionValue.value && nRecordsFound() > 25) {
					searchString.set('rowsPerPage', storedValue);
					let URL = location.origin + location.pathname + '?' + searchString;
					redirectMessage(storedValue);
					window.location = URL;
				}
			}
		}

		document.querySelector('#howmany').addEventListener('change', () => {
			let select = document.getElementById('howmany');
			let selection = select.selectedIndex;
			let optionValue = select.options[selection];
			setOption('reviewerOptions', 'howmany', optionValue.value);
		});
	}
}

function redirectMessage(storedValue) {
	let Fwebring = document.getElementById("listnav").querySelector('.webring');
	Fwebring.append(document.createElement('br'));
	let msgPara = document.createElement('p');
	msgPara.style.backgroundColor = flagBackgroundColor;
	msgPara.style.color = 'white';
	msgPara.style.fontWeight = 'bold';
	msgPara.append('Restarting with ' + storedValue + ' rows per page...please wait.');
	Fwebring.append(msgPara);
}

function regularReview() {
	let mainTable = document.getElementById('contents');
	let hyperlink = [];
	hyperlink['Download'] = '';
	hyperlink['Toggle'] = '';
	if (mainTable) {	// If we have a table of records, e.g., not "Congratulations! You have no more records to review"
		document.addEventListener('keydown', keyboardHandler);

		let filterForm = document.getElementById('filterwrapper');
		if (filterForm) {	// Turn off keyboard handling when in filter form; turn it back on when leaving.
			filterForm.addEventListener('focusin', () => { document.removeEventListener('keydown', keyboardHandler) });
			filterForm.addEventListener('focusout', () => { document.addEventListener('keydown', keyboardHandler) });
		}

		let bulkactions = document.getElementById('bulkactions');
		if (bulkactions) {	// Turn off keyboard handling when in disposition form; turn it back on when leaving.
			bulkactions.addEventListener('focusin', () => { document.removeEventListener('keydown', keyboardHandler) });
			bulkactions.addEventListener('focusout', () => { document.addEventListener('keydown', keyboardHandler) });
		}

		mainTable.querySelector('tr').setAttribute('id', 'tableHeader');	// Label header row for future reference

		performDeferToggle(mainTable);
		hyperlink['Download'] = buildCSV(mainTable);	//	First set up the CSV download
		hyperlink['Toggle'] = setupToggleDeferred(mainTable);	// Set up "Toggle deferred" hyperlink
		hyperlink['Species'] = setupSelectSpecies(mainTable); // Set up species selection list
		mainTable.insertBefore(createHistoryDiv(), mainTable.firstElementChild);	// Set up recall output
		// Handler for when select all is checked
		mainTable.querySelector('input.checkbox').addEventListener('change', () => { setTimeout(colorSelectAll, 100); });
	} else {	// Special case when review queue is empty, "Congratulations! You have no more records to review"
		let historyDiv = createHistoryDiv();
		historyDiv.style.position = 'absolute';
		historyDiv.style.left = '230px';
		historyDiv.style.top = '175px';
		document.getElementById('listnav').insertBefore(historyDiv, null);
	}
	hyperlink['DocList'] = makeDocList();	// Set up reviewer documents hyperlink
	hyperlink['Recall'] = CreateRecallControl();	// Create recall hyperlink

	hyperlink['Extension'] = document.createElement('a');
	hyperlink['Extension'].appendChild(document.createTextNode("Extension documentation"));
	hyperlink['Extension'].appendChild(document.createElement('br'));
	let vspan = document.createElement('span');
	vspan.style.fontSize = '8pt';
	hyperlink['Extension'].appendChild(vspan);
	let version = chrome.runtime.getManifest().version;
	let versionString = "v" + version;
	if (chrome.runtime.getManifest().version_name)
		versionString += " -- " + chrome.runtime.getManifest().version_name;
	vspan.appendChild(document.createTextNode(versionString));

	hyperlink['Extension'].setAttribute("href", chrome.runtime.getManifest().homepage_url + '#');
	hyperlink['Extension'].setAttribute("target", "_blank");

	hyperlink['WhatsNew'] = document.createElement('a');
	hyperlink['WhatsNew'].appendChild(document.createTextNode("What's New"));
	hyperlink['WhatsNew'].setAttribute("href", chrome.runtime.getManifest().homepage_url + "#whatsnew");
	hyperlink['WhatsNew'].setAttribute("target", "_blank");
	hyperlink['WhatsNew'].style.color = 'red';

	pulldownHyperlinks(hyperlink);

	// Initialize focus row from stored value, if any
	focusRowNumber = sessionStorage.getItem('focusRowNumber');
	if (Number(focusRowNumber)) {
		focusRow = document.getElementById('rowid' + focusRowNumber);
		if (focusRow) {
			focusRow.style.background = focusColor;
			keepInView(focusRow, 'main entry');
		} else {	// Previous focus row position is now off the end, e.g. when filtering species
			focusRowNumber = 0;
			sessionStorage.setItem('focusRowNumber', focusRowNumber);
		}
	} else {
		focusRowNumber = 0;
	}
}

function colorSelectAll(check = 'none') {	// Set row background color when select all is toggled. Optionally toggle checkboxes.
	document.getElementById('contents').querySelectorAll('input.checkbox').forEach(function (input) {
		let displayType;
		switch (check) {
			case 'none':	// Let built-in code handle checkmarks. Remove class indicating individually checked rows.
				input.classList.remove('Kchecked');
				break;
			case true:
				if (input.parentNode.tagName == 'TD') {	// Skip the header row, which has TH instead of TD, and no display-type set
					displayType = input.parentNode.parentNode.style.display;	// display type for the row
				} else {
					displayType = '';
				}
				// Check all rows that are visible
				input.checked = (displayType == 'table-row');

				break;
			case false:	// Remove any checks from a previous call. Leave individually checked rows.
				if (!input.classList.contains('Kchecked')) {
					input.checked = false;
				}
				break;
		}

		let rowNumber = input.id.substring(6);
		setRowBackground(rowNumber);
		if (rowNumber == focusRowNumber) {
			document.getElementById('rowid' + rowNumber).style.background = focusColor;
		}
	});
}

function keepInView(element,caller) {
	if (element) {
		let rect = element.getBoundingClientRect();
		let fudge = 150;
		if (rect.top < 70) {
			let scroll = rect.top - fudge;
			window.scrollBy(0, scroll);
		} else if (rect.bottom + 50 > document.documentElement.clientHeight) {
			let scroll = rect.top - document.documentElement.clientHeight + fudge;
			window.scrollBy(0, scroll);
		}
	}
}

function pulldownHyperlinks(hyperlink) {
	// Create a paragraph to contain the pulldown button
	let hyperlinkPulldownButton = document.createElement('p');
	hyperlinkPulldownButton.setAttribute('id', 'PullDown');
	hyperlinkPulldownButton.setAttribute("class", "toggler");
	hyperlinkPulldownButton.textContent = "Add-ons";
	hyperlinkPulldownButton.style.color = '#3366cc';

	document.getElementById('optiontoggler').insertAdjacentElement('afterend', hyperlinkPulldownButton);

	// Create a div to contain the list
	let hyperlinkDiv = document.createElement('div');
	hyperlinkDiv.setAttribute("id", 'hyperlinkDiv');
	hyperlinkDiv.style.position = 'absolute';
	hyperlinkDiv.style.left = '130px';
	if (document.getElementById('contents')) {
		hyperlinkDiv.style.top = '120px';	// Regular table
	} else {
		hyperlinkDiv.style.top = '200px';	// You have no more records to review
	}
	hyperlinkDiv.style.border = 'medium solid ' + greenBackground;
	hyperlinkDiv.style.width = '15em';
	hyperlinkDiv.style.backgroundColor = boxBackgroundColor;
	hyperlinkDiv.style.paddingTop = '1em';
	hyperlinkDiv.style.paddingBottom = '1em';
	hyperlinkDiv.style.display = 'none';
	hyperlinkDiv.style.zIndex = 1;
	document.getElementById("listnav").appendChild(hyperlinkDiv);

	// Create the list of addons
	let addonUL = document.createElement('ul');
	addonUL.style.listStyle = 'none';
	addonUL.style.marginLeft = '15px';
	hyperlinkDiv.appendChild(addonUL);

	addonLink(addonUL, hyperlink['Recall'], true, hyperlinkDiv,11);
	addonLink(addonUL, hyperlink['Toggle'], false, hyperlinkDiv,6);
	addonLink(addonUL, hyperlink['Species'], true, hyperlinkDiv,4);
	addonLink(addonUL, hyperlink['DocList'], true, hyperlinkDiv,7);
	addonLink(addonUL, hyperlink['Download'], true, hyperlinkDiv,7);
	addonLink(addonUL, hyperlink['Extension'], true, hyperlinkDiv,1);
	addonLink(addonUL, hyperlink['WhatsNew'], true, hyperlinkDiv,8);

	hyperlinkPulldownButton.addEventListener('mouseenter', function () {
		hyperlinkPulldownButton.style.textDecoration = 'underline'
		document.getElementById('hyperlinkDiv').style.display = 'block';
	});

	var timeoutID;

	hyperlinkPulldownButton.addEventListener('mouseleave', function () {
		hyperlinkPulldownButton.style.textDecoration = 'none';
		timeoutID = setTimeout(() => { hyperlinkDiv.style.display = 'none'; }, 80);
	});

	hyperlinkDiv.addEventListener('mouseenter', function () {
		clearTimeout(timeoutID);
		hyperlinkDiv.addEventListener('mouseleave', () => { hyperlinkDiv.style.display = 'none'; });
	});
}

function addonLink(addonUL, addon, clear, hyperlinkDiv,padRight) {
	if (addon) {
		let item = document.createElement('li');
		if (isMobile()) {
			item.style.lineHeight = '35px';
		} else {
			item.style.lineHeight = '30px';
		}
		item.style.paddingLeft = '2em';
		item.style.textIndent = '-2em';

		addon.style.paddingRight = padRight + 'em';
		addon.style.paddingTop = '.4em';
		addon.style.paddingBottom = '.4em';

		item.addEventListener('mouseenter', () => { addon.style.backgroundColor = itemBackgroundColor });
		item.addEventListener('mouseenter', () => { item.querySelector('a').style.color = 'white' });
		item.addEventListener('mouseleave', () => { addon.style.backgroundColor = boxBackgroundColor });
		item.addEventListener('mouseleave', () => { item.querySelector('a').style.color = ' #36c' });

		addonUL.appendChild(item);
		item.appendChild(addon);
		if (clear) {
			addon.addEventListener('click', function () {
				hyperlinkDiv.style.display = 'none';
			});
		}
	}
}

function CreateRecallControl() {
	// Create a paragraph to contain the hyperlink
	// We are going to build <a id=recallAnchor href=# class=toggler>Recall</a>
	// Create an anchor element
	let recallAnchor = document.createElement('a');	// This is the actual toggle hyperlink
	recallAnchor.setAttribute("id", 'recallAnchor');		// Not actually used
	recallAnchor.appendChild(document.createTextNode("Recall"));
	recallAnchor.setAttribute("href", "#");

	// This function will execute when recallAnchor is clicked.
	// It toggles the display status of previously updated records.
	recallAnchor.onclick = function () {
		let recallDiv = document.getElementById('recallDiv');
		if (recallDiv.style.display === 'none') {
			recallDiv.style.display = 'block';
		} else {
			recallDiv.style.display = 'none';
		}
	}
	return (recallAnchor);
}

async function finishMapURL(URL, OBS) { // Need to get ISO date via api, which has to be done asynchronously
	let response = await fetch('https://review.ebird.org/admin/api/v1/obs/view/' + OBS);
	let json = await response.json();
	let ISOdate = json.sub.obsDt;

	//	Create the anchor for the map
	const map = document.createElement('a');
	map.appendChild(document.createTextNode('eBird species map for season'));
	map.setAttribute('style', 'float:right');
	map.setAttribute('target', '_blank');
	//	Insert hyperlink at top right
	document.getElementById('reviewForm').insertBefore(map, document.getElementById('submissiondetails'));

	//	Get the numeric month of the observation date from the ISO date
	const month = parseInt(ISOdate.split('-')[1]);
	let Bmonth = (month > 1) ? month - 1 : 12;
	let Emonth = (month < 12) ? month + 1 : /*1*/ 12;	// If end month should be 1, use 12 instead due to eBird bug
	let URLend =
		'&bmo=' + Bmonth +
		'&emo=' + Emonth +
		'&zh=true&gp=true';

	map.setAttribute('href', URL + URLend);
}

function makeDocList() {	// Prepare the clickable list of reviewer docs
	if (!document.body.contains(document.getElementById('toglDocsAnchor'))) {	// Create this paragraph only if not already done
		// Create an anchor element
		let hyperlinkDocAnchor = document.createElement('a');
		hyperlinkDocAnchor.setAttribute("id", 'toglDocsAnchor');
		hyperlinkDocAnchor.appendChild(document.createTextNode("Reviewer docs"));
		hyperlinkDocAnchor.setAttribute("href", "#");

		// Create a div to contain the list
		let docDiv = document.createElement('div');
		docDiv.setAttribute("id", 'docDiv');
		docDiv.style.position = 'absolute';
		docDiv.style.left = '130px';
		docDiv.style.top = '200px';
		docDiv.style.border = 'medium solid ' + greenBackground;
		docDiv.style.width = '15em';
		docDiv.style.backgroundColor = boxBackgroundColor;
		docDiv.style.paddingTop = '1em';
		docDiv.style.paddingBottom = '1em';
		docDiv.style.display = 'none';
		docDiv.style.zIndex = 1;
		document.getElementById("listnav").appendChild(docDiv);

		docDiv.addEventListener('click', () => {	// Close the document list when it is clicked on
			document.getElementById('docDiv').style.display = 'none';
		});

		if (document.getElementById('contents')) {
			document.getElementById('contents').addEventListener('click', () => {	// Close the document list when table is clicked on
				document.getElementById('docDiv').style.display = 'none';
			});
		}

		docDiv.addEventListener('mouseenter', () => {	// Once the mouse enters the document list;
			docDiv.addEventListener('mouseleave', () => {	// Close the document list when the mouse leaves
				document.getElementById('docDiv').style.display = 'none';
			});
		});

		// Create the unordered list of links
		let docUL = document.createElement('ul');
		docUL.style.listStyle = 'none';
		docUL.style.marginLeft = '15px';
		docDiv.appendChild(docUL);

		let URLlist = [['eBird Reviewer Handbook', 'https://drive.google.com/file/d/1zeGEwMt9vrJL3dvj1aAuYodErB8ikl3e/view?usp=share_link'],
		['eBird Regional Editors', 'https://docs.google.com/spreadsheets/d/1i08drC6kGqequ_uRB6vgRdMaClcTljX0pvDzSS0ARic/edit#gid=124519153'],
		['Exotics and taxonomy files', 'https://drive.google.com/drive/folders/1CzYzrR4DOMWpTxPnafvqjBw77JcTUcJr'],
		['Filter taxa recommendations', 'https://docs.google.com/spreadsheets/d/1p-VRE2GhUuJXv6ADUehw7tlVLauYB7YI/edit#gid=446487343'],
		['Exotic species guidelines','https://docs.google.com/document/d/1VHA1bpLI5zOk89WtbytUMfJME567SGRJUrHxmSr7Or8/'],
		['Google Drive folder', 'https://drive.google.com/drive/folders/1LtQA_2lbKyjQ4aDpPwUTPCgRWcQISa7u']];

		const liList = [];
		const linkList = [];
		for (let i = 0; i < URLlist.length; i++) {

			liList[i] = document.createElement('li');
			liList[i].style.lineHeight = '30px';
			docUL.appendChild(liList[i]);

			linkList[i] = document.createElement('a');
			linkList[i].appendChild(document.createTextNode(URLlist[i][0]));
			linkList[i].setAttribute('href', URLlist[i][1]);
			linkList[i].setAttribute('target', '_blank');
			linkList[i].style.textDecoration = 'none';
			liList[i].appendChild(linkList[i]);
		}
		// This function will execute when "Reviewer docs" is clicked.
		hyperlinkDocAnchor.addEventListener('click', function () {
			let docDiv = document.getElementById('docDiv');
			if (docDiv.style.display == 'block') {
				docDiv.style.display = 'none';
			} else {
				docDiv.style.display = 'block';
			}
		});
		return (hyperlinkDocAnchor);
	}
}

function buildCSV(mainTable) { 	//	set up the CSV download
	let spreadSheet = [];
	let doHeaders = true;
	let headers = [];
	let rownum = 0;
	let mediaCell;
	const parser = new DOMParser();
	let rowCounter = 0;

	mainTable.querySelectorAll('tr').forEach(function (elTr) {
		// Extract the data from each row of the queue/search
		let row = [];
		let subid, species, evidence, count, obsdate, user, locname, county, state, validity, status, dayOfYear;
		let checklist, chklstCell, chklstLink;
		let OBS;
		let Class, html, el;
		let speciesCell, submissionCell;
		let RowObject = new RowClass();

		if (!doHeaders) {	// Skip header row
			// Extra steps for keyboard focus, not part of building CSV.
			elTr.addEventListener('mouseenter', (ev) => { mouseRow = ev.target.id; });
			elTr.addEventListener('click', (ev) => {
				let mouseRowNumber = mouseRow.substring(5);
				if (focusRowNumber) {	// If keyboard focus is initialized
					setRowBackground(focusRowNumber);
					focusRow = document.getElementById(mouseRow);
					keepInView(focusRow, 'click handler for mouse row');
					focusRow.style.background = focusColor;
					focusRowNumber = mouseRowNumber;
					sessionStorage.setItem('focusRowNumber', focusRowNumber);
				} else {	// Set green background when keyboard focus uninitialized
					let thisRow = document.getElementById('rowid' + mouseRowNumber);
					if (document.getElementById('obsIds' + mouseRowNumber).checked) {
						thisRow.style.background = greenBackground;
					} else {
						thisRow.style.removeProperty("background");
					}
				}
			});
		}

		elTr.querySelectorAll('td').forEach(function (Cell) {
			// Look at each column cell in this row of the table
			Class = Cell.getAttribute('class').split(' ')[0];
			html = parser.parseFromString(Cell.innerHTML, "text/html");
			el = html.body.firstChild;

			if (doHeaders && (Class !== 'select') && (Class !== 'details')) {
				// In the first row, save the headers of the columns that we are going to keep;
				// also create and save header of the new day of year column we will create
				headers.push(Class);
				if (Class === 'obsdate') {
					headers.push('day of year');
				}
			}
			switch (Class) {
				case "select":
					// "select" column, do nothing
					OBS = el.getAttribute('value');
					RowObject.observation = OBS;
					// Extra steps for keyboard focus, not part of building CSV.
					Cell.addEventListener('click', () => {
						let cellInput = Cell.querySelector('input');
						if (cellInput.checked) {
							cellInput.classList.add('Kchecked');
						} else {
							cellInput.classList.remove('Kchecked');
						}
					});
					break;
				case "subID":
					// "subID" column, get the report subID and set up the eBird checklist URL
					if (el.nodeName === 'A') {
						subid = el.textContent;
						checklist = 'https://ebird.org/checklist/' + subid
						submissionCell = Cell;
					}
					break;
				case "species":
					// "species" column, get the species name
					if (el.nodeName === 'LABEL') {
						species = el.textContent.trim();
						lookup[OBS] = species;
						speciesCell = Cell;
						if (!listOfSpecies.includes(species)) {
							listOfSpecies.push(species);
						}
						RowObject.species = Cell;
					}
					break;
				case "evidence":
					mediaCell = document.createElement('td');
					elTr.insertBefore(mediaCell, Cell);
					setupMedia(elTr, mediaCell, OBS);
					if (html) {
						// "evidence" column, get the code letter for type of details
						if (el && el.nodeName === 'A') {
							let ev = parser.parseFromString(el.textContent, "text/html");
							evidence = ev.body.firstChild.textContent;
						}
					}
					break;
				case "count": count = Cell.textContent;
					RowObject.count = Cell;
					break;
				case "obsdate": {
					// Get the observation date, also format a copy of the date as day of year (without the year)
					obsdate = Cell.textContent;
					let date = new Date(obsdate);
					let day = String(date.getDate()).padStart(2, '0');
					let month = String(date.getMonth() + 1).padStart(2, '0');
					dayOfYear = month + ' ' + day;
					RowObject.obsdate = Cell;
				}
					break;
				case "user":	// Get the user's name
					if (el.nodeName === 'A' && el.getAttribute('class') === 'userprofile') {
						user = el.textContent;
						RowObject.user = Cell;
					}
					break;
				case "locname": locname = Cell.textContent;
					Cell.setAttribute('id', OBS + 'location');
					checkIfHotspot(OBS);	// Hyperlink it if a hotspot
					RowObject.locname = Cell;
					break;
				case "county": county = Cell.textContent;
					RowObject.county = Cell;
					break;
				case "state":
					if (el.nodeName === '#text') {
						state = el.nodeValue;
						RowObject.state = Cell;
					}
					break;
				case "validity": validity = Cell.textContent;
					break;
				case "status": status = Cell.textContent;
					if (status == 'Deferred') {	// Gray out species name on deferred record
						speciesCell.querySelector('a').style.color = '#aaa';
						submissionCell.querySelector('a').style.color = '#ccc'; 
					}
					break;
				case "details": break;	// Don't keep anything from "details" column
			}
		});
		if (rownum++) {	// Skip row 0 (headers)
			rowCounter++;
			elTr.setAttribute('id', 'rowid' + rowCounter);	// for keyboard focus code
			row.push(subid);
			row.push('"' + species + '"');
			row.push(evidence);
			row.push(count);
			row.push('"' + obsdate + '"');
			row.push(dayOfYear);
			row.push('"' + user + '"');
			row.push('"' + locname + '"');
			row.push('"' + county + '"');
			row.push(state);
			row.push(validity);
			row.push(status);
			row.push(checklist);
			if (doHeaders) {
				// Put the headings in the first spreadsheet row, and
				// turn off flag for saving headers.
				spreadSheet.push(headers.join());
				doHeaders = false;
			} 
			checkRecord(RowObject);

			spreadSheet.push(row.join());	// Add this row to spreadsheet

			// Create a new table cell at the end of the row, for the eBird hyperlink
			chklstCell = document.createElement('td');
			chklstCell.setAttribute('class', 'KeBird');
			chklstCell.setAttribute('style', 'color:#ccc');
			elTr.appendChild(chklstCell);

			chklstLink = document.createElement('a');
			chklstCell.appendChild(chklstLink);
			chklstLink.appendChild(document.createTextNode('eBird'));
			chklstLink.setAttribute('href', checklist);
			chklstLink.setAttribute('target', '_blank');
		}
	});

	numRows = rowCounter;		// for keyboard focus code

	let headerRow = mainTable.querySelector('tr');
	headerRow.querySelectorAll('th').forEach(function (Header) {
		if (Header.textContent == 'Note') {
			let newHeader = document.createElement('th');
			newHeader.appendChild(document.createTextNode('Doc'));
			headerRow.insertBefore(newHeader, Header);
		}
	});

	// For a search, the result count will be displayed in the form "Showing 1 - 500" regardless of the actual count.
	// If the actual count is less than 500, we want to display the correct number, e.g. "Showing 1 - 13"
	let Fwebring = document.getElementById("listnav").querySelector('.webring');
	if (Fwebring) {
		let showing = Fwebring.querySelector('p');
		let actual = document.createElement('p');
		actual.setAttribute('id', 'actualShow');
		showing.after(actual);

		let rangeTextP = Fwebring.getElementsByTagName("p")[0]
		let rangeText = rangeTextP.textContent;	// result count
		rangeTextP.setAttribute('id', 'CLOrangeText');

		let message = setActualRange(rowCounter);
		actual.textContent = message;
	}

	// All done building the CSV, now set up the hyperlink for it.
	let downloadAnchor = document.getElementById('dlanchor');
	let a;
	if (!document.body.contains(downloadAnchor)) {	// Create this paragraph only if not already done
		// Create the anchor element to go in the paragraph
		a = document.createElement('a');
		a.setAttribute("id", 'dlAnchor');
		a.appendChild(document.createTextNode("Download csv"));
		a.setAttribute("download", 'eBird report.csv');	// Set the csv file name
	}
	else {
		a = document.getElementById('dlAnchor');
	}
	// Hook up the CSV data to the hyperlink
	a.href = window.URL.createObjectURL(new Blob(['\ufeff', spreadSheet.join('\r\n')], { type: 'text/csv' }));
	return (a);
	// All done with the CSV stuff, now on to the next feature
}

function RowClass() { this.name = 'RowObject' };

async function checkRecord(RowObject) {
	let OBS = RowObject.observation;
	let species = RowObject.species.textContent.trim();
	let count = RowObject.count.textContent;
	let obsdate = RowObject.obsdate.textContent;
	let user = RowObject.user.querySelector('a').textContent;
	let locname = RowObject.locname.textContent;
	let county = RowObject.county.textContent.trim();
	let state = RowObject.state.textContent;
	let json;

	try {
		const response = await fetch('https://review.ebird.org/admin/api/v1/obs/view/' + OBS);
		if (!response.ok) { throw new Error("Bad response"); }
		json = await response.json();
	} catch (error) {
		console.log("Fetch failed for " + OBS + ' (' + species + ')');
		flagCell(RowObject.species);
	}

	function flagCell(Cell) {
		Cell.style.backgroundColor = flagBackgroundColor;
		let anchor = Cell.querySelector('a');
		let element = anchor ? anchor : Cell;
		element.style.color = 'white';
		element.style.fontWeight = 'bold';
		let emPhrase = Cell.getElementsByTagName('em')[0];
		if (emPhrase) { // scientific name
			emPhrase.style.color = 'white';
		}
	}

	let commonName = json.taxon.commonName.trim();
	let sciName = json.taxon.sciName.trim();
	let fullName = commonName + ' ' + sciName;

	if (json) {
		if ((commonName != species) && (sciName != species) && (fullName != species)) {
			console.log('Mismatch for ' + OBS + ', "' + species + '" should be "' + fullName + '"');
			flagCell(RowObject.species);
		}

		if (json.obs.howManyStr.toLowerCase() != count.toLowerCase()) {
			console.log('Mismatch for ' + OBS + ', count of ' + count + ' should be ' + json.obs.howManyStr);
			flagCell(RowObject.count);
		}

		let date1 = Date.parse(json.sub.obsDt.substring(0, 10) + ' 00:00:00 GMT'); const d1 = new Date(date1);
		let date2 = Date.parse(obsdate + ' 00:00:00 GMT'); const d2 = new Date(date2);

		if (Date.parse(json.sub.obsDt.substring(0, 10) + ' 00:00:00 GMT') != Date.parse(obsdate + ' 00:00:00 GMT')) {
			console.log('Mismatch for ' + OBS + ', ' + obsdate + ' should be ' + json.sub.obsDt);
			flagCell(RowObject.obsdate);
		}

		if (json.observers[0].alias.trim() != user.trim()) {
			console.log('Mismatch for ' + OBS + ', "' + user + '" should be "' + json.observers[0].alias + '"');
			flagCell(RowObject.user);
		}

		if (json.loc.name != locname) {
			console.log('Mismatch for ' + OBS + ', ' + locname + ' should be ' + json.loc.name);
			flagCell(RowObject.locname);
		}

		if (typeof json.loc.subnational2Name === "undefined") json.loc.subnational2Name = "";
		if (json.loc.subnational2Name != county) {
			console.log('Mismatch for ' + OBS + ', ' + county + ' should be ' + json.loc.subnational2Name);
			flagCell(RowObject.county);
		}

		let stateArray = json.loc.subnational1Code.split("-");
		let stateCode = stateArray[1] + ' (' + stateArray[0] + ')';
		if (stateCode != state) {
			console.log('Mismatch for ' + OBS + ', ' + state + ' should be ' + stateCode);
			flagCell(RowObject.state);
		}
	}
}

async function setupMedia(elTr, mediaCell, OBS) {
	let commentRow = document.createElement('tr');
	elTr.after(commentRow);
	let commentTD = document.createElement('td');
	commentTD.setAttribute('colspan', 15);
	commentRow.appendChild(commentTD);
	commentTD.style.display = 'none';

	let mediaRow = document.createElement('tr');
	commentRow.after(mediaRow);
	let mediaTD = document.createElement('td');
	mediaTD.setAttribute('colspan', 15);
	mediaTD.setAttribute('class', 'assetarray');
	mediaRow.appendChild(mediaTD);
	mediaTD.style.display = 'none';
	getDetails(mediaCell, commentTD, mediaTD, OBS);
	mediaCell.addEventListener('click', (ev) => { toggleMedia(ev); });
}

function toggleMedia(ev) {
	let td = ev.srcElement.parentElement;
	toggleMediaRows(td.parentElement);
}

function toggleMediaRows(tr) {
	let commentTR = tr.nextElementSibling;
	let mediaTR = commentTR.nextElementSibling;

	let commentTD = commentTR.firstElementChild;
	let mediaTD = mediaTR.firstElementChild;

	if (commentTD.childNodes.length > 0 || mediaTD.childNodes.length > 0) {
		let display = commentTD.style.display == 'none' ? 'table-cell' : 'none';
		commentTD.style.display = display;
		if (display == 'none') {  // expanded indicates comments or media are displayed
			commentTD.classList.remove('expanded');
			mediaTD.classList.remove('expanded');
		} else {
			commentTD.classList.add('expanded');
			mediaTD.classList.add('expanded');
		}
		if (mediaTD.classList.contains('assetarray')) {
			getMedia(mediaTD);
		}
		else {
			mediaTD.style.display = display;
		}
	}
}

async function getDetails(mediaCell, commentTD, mediaTD, OBS) {
	const parser = new DOMParser();

	let response = await fetch('https://review.ebird.org/admin/reviewServices/getObsComments.do?obsId=' + OBS);
	let comments = await response.text();
	comments = comments.replace(/\\"/g, '"');	// unescape internal quotes
	comments = comments.slice(1, comments.length - 1);	// strip enclosing quotes.

	let checklistComments = false;
	response = await fetch('https://review.ebird.org/admin/api/v1/obs/view/' + OBS);
	let json = await response.json();
	if (json.sub.comments) {
		checklistComments = true;
		const clComment = parser.parseFromString('Checklist comments: ' + json.sub.comments, 'text/html');
		commentTD.append(clComment.body);
	}


	if (comments.length) {
		if (checklistComments)
			comments = 'Observation comments: ' + comments;
		const htmlComment = parser.parseFromString(comments, 'text/html');
		commentTD.append(htmlComment.body);

		let mediaIcon = document.createElement('i');
		mediaIcon.setAttribute('class', 'icon icon-ev-N');
		mediaIcon.appendChild(document.createTextNode('N'));
		mediaCell.appendChild(mediaIcon);
	}

	let mediaType = '';
	response = await fetch('https://review.ebird.org/admin/reviewServices/getObsMedia.do?obsId=' + OBS);

	json = await response.json();
	if (json.length > 0) {
		const asset = [];		// Macaulay id
		for (let index in json) {
			asset.push(json[index].assetId);
			switch (json[index].mediaType) {
				case 'P': if (mediaType == '' || mediaType == 'A') { mediaType = 'P' } break;
				case 'A': if (mediaType == '') { mediaType = 'A' } break;
				case 'V': mediaType = 'V'; break;
				default: mediaType = '';
			}
		}
		mediaTD.textContent = asset.toString();

		if (mediaType) {
			let mediaIcon = document.createElement('i');
			mediaIcon.setAttribute('class', 'icon icon-ev-' + mediaType);
			mediaIcon.appendChild(document.createTextNode(mediaType));
			if (mediaCell.firstElementChild) {
				mediaCell.firstElementChild.remove();	// Might have comment icon
			}
			mediaCell.appendChild(mediaIcon);
		}
	}
}

async function getMedia(mediaTD) {
	let assetList = mediaTD.textContent;
	if (assetList) {
		mediaTD.textContent = 'Fetching media...';
		mediaTD.style.display = 'table-cell';
		let resp = await fetch('https://search.macaulaylibrary.org/api/v1/search?includeUnconfirmed=T&sort=id_asc&catId=' + assetList);
		let json = await resp.json();

		const previewURL = [];
		const largeURL = [];
		const mediaURL = [];
		const userDisplayName = [];	// eBirder
		const catalogId = [];
		for (let index in json.results.content) {
			previewURL.push(json.results.content[index].previewUrl);
			largeURL.push(json.results.content[index].largeUrl);
			mediaURL.push(json.results.content[index].mediaUrl);
			userDisplayName.push(json.results.content[index].userDisplayName);
			catalogId.push(json.results.content[index].catalogId);
		}

		let mediaAnchor;
		let imgTag;
		let wavAnchor;
		let mediaDiv;
		mediaTD.textContent = '';
		for (let index in previewURL) {
			mediaAnchor = document.createElement('a');
			mediaAnchor.setAttribute('href', 'https://macaulaylibrary.org/asset/' + catalogId[index]);
			mediaAnchor.setAttribute('target', '_blank');

			let mtype = json.results.content[index].mediaType;	// Photo, Audio, Video

			imgTag = document.createElement('img');
			imgTag.setAttribute('src', previewURL[index]);
			imgTag.setAttribute('title', userDisplayName[index]);
			imgTag.style.marginRight = '5px';
			imgTag.style.marginBottom = '5px';

			mediaAnchor.appendChild(imgTag);

			mediaDiv = document.createElement('div');
			mediaDiv.appendChild(mediaAnchor);
			mediaDiv.style.display = 'inline-block';

			if (mtype == 'Video') {
				mediaDiv.style.border = 'thick solid blue';
			}

			if (mtype == 'Audio') {
				wavAnchor = document.createElement('a');
				wavAnchor.setAttribute('href', mediaURL[index]);
				wavAnchor.appendChild(document.createTextNode('.mp3'));

				mediaDiv.appendChild(document.createElement('br'));
				mediaDiv.appendChild(wavAnchor);
			}
			mediaTD.setAttribute('class', 'mediacomplete');
			mediaTD.classList.add('expanded');
			mediaTD.appendChild(mediaDiv);
		}
	}
}

async function checkIfHotspot(OBS) {
	// If the location is a hotspot, make a clickable link to hotspot page
	let response = await fetch('https://review.ebird.org/admin/api/v1/obs/view/' + OBS);
	let json = await response.json();
	if (json.loc.isHotspot) {
		let anchor = document.createElement('a');
		anchor.href = 'https://ebird.org/hotspot/' + json.sub.locId;
		anchor.setAttribute('target', '_blank');
		let locationTD = document.getElementById(OBS + 'location');
		anchor.textContent = locationTD.textContent;
		locationTD.textContent = '';
		locationTD.append(anchor);
	}
}

function setupToggleDeferred(mainTable) {	// Set up "Toggle deferred" hyperlink
	// Set up a div to display the toggle status
	let toggleStatusDiv = document.createElement('div');
	toggleStatusDiv.setAttribute("id", 'toggleStatusDiv');
	toggleStatusDiv.style.position = 'absolute';
	toggleStatusDiv.style.left = '225px';
	toggleStatusDiv.style.top = '70px';
	toggleStatusDiv.style.border = 'medium solid ' + greenBackground;
	toggleStatusDiv.style.backgroundColor = boxBackgroundColor;
	toggleStatusDiv.style.padding = '1em';
	toggleStatusDiv.style.display = 'none';
	toggleStatusDiv.style.zIndex = 1;
	document.getElementById("listnav").appendChild(toggleStatusDiv);
	let toggleStatus = document.createElement('p');	// Paragraph for displaying toggle status
	toggleStatusDiv.appendChild(toggleStatus);
	toggleStatus.setAttribute('id', 'toggleStatus');
	toggleStatus.style.color = 'blue';
	toggleStatusDiv.onclick = function () {
		let deferToggle = Number(sessionStorage.getItem('deferToggle'));
		deferToggle = ++deferToggle % 4;	// Cycle through four different views
		sessionStorage.setItem('deferToggle', deferToggle);
		performDeferToggle(mainTable);
	}

	setToggleStatus();

	// Create an anchor element
	let ae = document.createElement('a');
	ae.setAttribute("id", 'toglStatusAnchor');
	ae.appendChild(document.createTextNode("Toggle deferred"));
	ae.setAttribute("href", "#");
	// This function will execute when "Toggle deferred" is clicked.
	// It toggles the display status of deferred reports.
	ae.onclick = function () {
		let deferToggle = Number(sessionStorage.getItem('deferToggle'));
		deferToggle = ++deferToggle % 4;	// Cycle through four different views
		sessionStorage.setItem('deferToggle', deferToggle);
		performDeferToggle(mainTable);
	}
	return (ae);
}

function performDeferToggle(mainTable) {

	let deferToggle = Number(sessionStorage.getItem('deferToggle'));
	if (deferToggle === undefined) {
		deferToggle = 0;
	}

	// Hide any rows expanded with comments or media
	mainTable.querySelectorAll('.expanded').forEach(function (Row) {
		Row.style.display = 'none';
	});

	let reviewRows = document.getElementsByClassName('status');	// Each row is an observation in the queue

	let checkAll = mainTable.querySelector('input.checkbox');
	if (deferToggle != 0) {
		checkAll.disabled = true;
	} else {
		checkAll.disabled = false;
	}

	setToggleStatus();

	let speciesToggleInEffect = sessionStorage.getItem('species');
	if (speciesToggleInEffect === undefined || speciesToggleInEffect == 'All species') {
		speciesToggleInEffect = false;
	}

	let recordCount = 0;
	firstDisplayedRow = -1;
	for (let i = 0; i < reviewRows.length; i++) {
		let thisSpecies = reviewRows[i].parentNode.querySelector('td.species').textContent.trim();
		if (!speciesToggleInEffect || speciesToggleInEffect == thisSpecies) {
			if (deferMatch(i, reviewRows, deferToggle)) recordCount++;
		}
	}
	lastDisplayedRow++; // zero-based to one-based;
	firstDisplayedRow++;
	if (recordCount==0 && deferToggle==3) { // Rereview records are not present so continue to all records
		sessionStorage.setItem('deferToggle', 0);
		performDeferToggle(mainTable);
	}

	visibleCount();
}

function deferMatch(i, reviewRows, deferToggle) {
	// Determine whether record i should be displayed based on defer status and filtering
	let displayRecord = false;
	switch (deferToggle) {
		case 0:	// Display all rows
			reviewRows[i].parentNode.style.display = 'table-row';
			lastDisplayedRow = i;
			if (firstDisplayedRow < 0) { firstDisplayedRow = i }
			displayRecord = true;
			break;
		case 1:	// Display only non-deferred observations
			if (reviewRows[i].classList.contains('deferred')) {
				reviewRows[i].parentNode.style.display = 'none';
			}
			else {
				reviewRows[i].parentNode.style.display = 'table-row';
				lastDisplayedRow = i;
				if (firstDisplayedRow < 0) { firstDisplayedRow = i }
				displayRecord = true;
			}
			break;
		case 2:	// Display only Deferred observations
			if (reviewRows[i].classList.contains('deferred')) {
				reviewRows[i].parentNode.style.display = 'table-row';
				lastDisplayedRow = i;
				if (firstDisplayedRow < 0) { firstDisplayedRow = i }
				displayRecord = true;
			}
			else {
				reviewRows[i].parentNode.style.display = 'none';
			}
			break;
		case 3:	// Display only inreview rows
			if (reviewRows[i].classList.contains('inreview')) {
				reviewRows[i].parentNode.style.display = 'table-row';
				lastDisplayedRow = i;
				if (firstDisplayedRow < 0) { firstDisplayedRow = i }
				displayRecord = true;
			}
			else {
				reviewRows[i].parentNode.style.display = 'none';
			}
			break;
		default:
	}
	return displayRecord;
}

function setToggleStatus() {
	// Put up a heading to display which toggle is in effect
	let toggleStatusDiv = document.getElementById('toggleStatusDiv');
	if (toggleStatusDiv) {
		let toggleStatus = document.getElementById('toggleStatus');
		switch (Number(sessionStorage.getItem('deferToggle'))) {
			case 1:
				toggleStatus.textContent = 'Non-deferred records';
				toggleStatusDiv.style.display = 'block';
				break;
			case 2:
				toggleStatus.textContent = 'Deferred records';
				toggleStatusDiv.style.display = 'block';
				break;
			case 3:
				toggleStatus.textContent = 'Rereview records';
				toggleStatusDiv.style.display = 'block';
				break;
			default:	// 0 or undefined
				toggleStatus.textContent = '';
				toggleStatusDiv.style.display = 'none';
		}
	}
}

function setupSelectSpecies(mainTable) {	// Set up "Select species" hyperlink, and create the list of species
	// Set up a div to contain the species list
	let toggleSpeciesDiv = document.createElement('div');
	toggleSpeciesDiv.setAttribute("id", 'toggleSpeciesDiv');
	toggleSpeciesDiv.style.position = 'absolute';
	toggleSpeciesDiv.style.left = '130px';
	toggleSpeciesDiv.style.top = '175px';
	toggleSpeciesDiv.style.border = 'medium solid ' + greenBackground;
	toggleSpeciesDiv.style.backgroundColor = boxBackgroundColor;
	toggleSpeciesDiv.style.padding = '1em';
	toggleSpeciesDiv.style.display = 'none';
	toggleSpeciesDiv.style.zIndex = 1;
	toggleSpeciesDiv.addEventListener('mouseleave', () => { toggleSpeciesDiv.style.display = 'none' });
	document.getElementById("listnav").appendChild(toggleSpeciesDiv);
	let speciesUL = document.createElement('ul');	// list of species
	speciesUL.style.listStyle = 'none';
	speciesUL.style.marginLeft = '5px';
	toggleSpeciesDiv.appendChild(speciesUL);
	speciesUL.setAttribute('id', 'speciesUL');

	let item = [];
	listOfSpecies.unshift('All species');
	for (let i = 0; i < listOfSpecies.length; i++) {
		item[i] = document.createElement('li');
		item[i].addEventListener('mouseenter', () => { item[i].style.backgroundColor = itemBackgroundColor });
		item[i].addEventListener('mouseenter', () => { item[i].style.color = 'white' });
		item[i].addEventListener('mouseleave', () => { item[i].style.backgroundColor = boxBackgroundColor });
		item[i].addEventListener('mouseleave', () => { item[i].style.color = 'black' });
		item[i].addEventListener('click', (ev) => { performSelectSpecies(mainTable, ev.target.textContent); });
		if (isMobile()) {
			item[i].style.lineHeight = '35px';
		}
		speciesUL.appendChild(item[i]);
		item[i].appendChild(document.createTextNode(listOfSpecies[i]));
	}

	// Create an anchor element
	let ae = document.createElement('a');
	ae.setAttribute("id", 'listSpeciesAnchor');
	ae.appendChild(document.createTextNode("Select species"));
	ae.setAttribute("href", "#");

	ae.onclick = function () {
		document.getElementById('toggleSpeciesDiv').style.display = 'block';
	}

	let previousSpecies = sessionStorage.getItem('species');
	if (previousSpecies) {
		let reviewRows = document.getElementsByClassName('status');	// Each row is an observation in the queue
		performSelectSpecies(mainTable, previousSpecies);
		let displayCount = visibleCount();
		if (displayCount == 0) {
			firstDisplayedRow = -1;
			// Reset, showing all species, but check for defer filtering
			let deferToggleInEffect = Number(sessionStorage.getItem('deferToggle'));
			for (let i = 0; i < reviewRows.length; i++) {
				if (!deferToggleInEffect) {
					reviewRows[i].parentNode.style.display = 'table-row';
				} else {
					deferMatch(i, reviewRows, deferToggleInEffect);
				}
				if (reviewRows[i].parentNode.style.display == 'table-row') {
					lastDisplayedRow = i;
					if (firstDisplayedRow < 0) { firstDisplayedRow = i }
				}
			}
			lastDisplayedRow++; // zero-based to one-based;
			firstDisplayedRow++;

			sessionStorage.removeItem('species');
			visibleCount();
		} else {
		}
	} else {
	}

	return (ae);
}

function performSelectSpecies(mainTable, targetSpecies) {
	sessionStorage.setItem('species', targetSpecies);

	document.getElementById('toggleSpeciesDiv').style.display = 'none';

	// Hide any rows expanded with comments or media
	mainTable.querySelectorAll('.expanded').forEach(function (Row) {
		Row.style.display = 'none';
	});

	let showAll = (targetSpecies == 'All species');

	let checkAll = mainTable.querySelector('input.checkbox');
	if (showAll) {
		checkAll.disabled = false;
	} else {
		checkAll.disabled = true;
	}

	// if deferToggleInEffect,
	//		performSelectSpecies leaves visibility of selected species unchanged,
	//		all non-selected species hidden
	let deferToggleInEffect = Number(sessionStorage.getItem('deferToggle'));

	firstDisplayedRow = -1;
	let reviewRows = document.getElementsByClassName('status');	// Each row is an observation in the queue
	for (let i = 0; i < reviewRows.length; i++) {
		let thisSpecies = reviewRows[i].parentNode.querySelector('td.species').textContent.trim();
		if (thisSpecies == targetSpecies || showAll) {
			if (!deferToggleInEffect) {
				reviewRows[i].parentNode.style.display = 'table-row';
			} else {
				deferMatch(i, reviewRows, deferToggleInEffect);
			}
			if (reviewRows[i].parentNode.style.display == 'table-row') {
				lastDisplayedRow = i;
				if (firstDisplayedRow < 0) { firstDisplayedRow = i }
			}
		} else {
			reviewRows[i].parentNode.style.display = 'none';
		}
	}
	lastDisplayedRow++; // zero-based to one-based;
	firstDisplayedRow++;

	visibleCount();
}

function visibleCount() {
	let targetSpecies = sessionStorage.getItem('species');
	let deferToggle = sessionStorage.getItem('deferToggle');
	let everFiltered = targetSpecies != null || deferToggle != null;

	if (targetSpecies == 'All species' || targetSpecies == null)
		targetSpecies = '';
	deferToggle = Number(deferToggle);

	let reviewRows = document.getElementsByClassName('status');	// Each row is an observation in the queue
	let displayCount = 0;
	let visibleP = document.getElementById('actualShow');
	let message;
	if (everFiltered) {	// If any rows might be hidden
		const colors = [boxBackgroundColor, '#ffffff'];
		let colorCursor = 0;
		for (let i = 0; i < reviewRows.length; i++) {
			if (reviewRows[i].parentNode.style.display == 'table-row') {
				displayCount++;
				// Set background colors so they alternate
				reviewRows[i].parentNode.style.backgroundColor = colors[colorCursor];
				colorCursor = ++colorCursor % 2;
			}
		}
		message = displayCount + ' ' + targetSpecies + ' visible';
	} else {
		displayCount = reviewRows.length;
	}

	if (displayCount == reviewRows.length) {
		message = setActualRange(displayCount);
	}

	if (visibleP) {
		visibleP.textContent = message;
	}
	return displayCount;
}

function setActualRange(rowCounter) {
	if (!document.getElementById('CLOrangeText')) return false;

	let rangeText = document.getElementById('CLOrangeText').textContent;
	// Parse out the tokens from result count
	let tokens = rangeText.split(" ");
	let rangeEnd = tokens[tokens.length - 1];
	let rangeStart = tokens[tokens.length - 3];
	let actualRangeEnd = Number(rangeStart) + rowCounter - 1;
	let actualRange = rangeStart + " - " + actualRangeEnd;

	rangeEnd = rangeEnd.replace(/\)$/, ''); // Delete last character if it's a right parenthesis.

	if (rangeEnd != actualRangeEnd) {
		return ('Actually showing ' + actualRange);
	} else {
		return ('');
	}
}

function nRecordsFound() {	// In, e.g., "42 found (showing 1 - 25)", return 42
	let counts = document.getElementsByClassName('totalobs');
	if (!counts.length) return 0;
	return (counts[0].textContent.split(" ")[0]);
}

function historyWindow() {
	//	From, e.g.,
	//<h3 class="obsreview_species"><a href="https://birdsoftheworld.org/bow/species/snogoo/cur/introduction">Snow Goose</a>
	//<h3 class="obsreview_species"><a href="https://ebird.org/species/passer1">passerine sp.</a>
	//	parse out snogoo or passer1
	const parser = new DOMParser();
	const anchor = document.querySelector('.obsreview_species').innerHTML;
	const urlPieces = parser.parseFromString(anchor, "text/html").body.firstChild.href.split('/');
	let sixcode = '';
	for (let up = 0; up < urlPieces.length; up++) {
		if (urlPieces[up] === 'species') {
			sixcode = urlPieces[up + 1];
			break;
		}
	}
	let species = parser.parseFromString(anchor, "text/html").body.firstChild.textContent;
	const urlParams = new URLSearchParams(location.search);
	let OBS = '';
	if (urlParams.has('obsID')) {
		OBS = urlParams.get('obsID');
		lookup[OBS] = species;
	}

	//	Now within obsreview_table, from e.g,
	//	<td class="name"><a target="_blank" href="https://www.google.com/maps/place/35.727862,-78.776077">
	//	parse out 35.727862,-78.776077
	const tr = document.querySelector('.obsreview_table').querySelectorAll('td')[1].innerHTML;
	const coords = parser.parseFromString(tr, 'text/html').body.firstChild.href.split('/')[5].split(',');
	const Y = parseFloat(coords[0]);
	const X = parseFloat(coords[1]);
	//	Set up the URL for the species map
	const URL = 'https://ebird.org/map/' + sixcode + '?neg=false' +
		'&env.minX=' + (X - 0.5) +
		'&env.minY=' + (Y - 0.5) +
		'&env.maxX=' + (X + 0.5) +
		'&env.maxY=' + (Y + 0.5);
	finishMapURL(URL, OBS);
}

function submissionWindow() {
	const parser = new DOMParser();
	let theForm = document.getElementById('reviewForm');
	let theTable = theForm.getElementsByTagName('tbody')[0];
	let Class, html, el;
	if (theTable) {	// Go through the table of species for this submission
		theTable.querySelectorAll('tr').forEach(function (elTr) {
			// Examine the data from each row
			let OBS;
			elTr.querySelectorAll('td').forEach(function (Cell) {
				// Look at the "select" and "species" column cells in this row of the table
				Class = Cell.getAttribute('class').split(' ')[0];
				html = parser.parseFromString(Cell.innerHTML, "text/html");
				el = html.body.firstChild;

				switch (Class) {
					case "select":
						OBS = el.getAttribute('value');	// The "select" cell has the OBS value
						break;
					case "species":
						if (el.nodeName === 'LABEL') {
							lookup[OBS] = el.textContent.trim();	// Insert the species name into the OBS lookup table
						}
						break;
					default:
				}
			});
		});
	}
}

function keyboardHandler(ev)
{
	if (focusRowNumber == -1) { // keyboard select all is active
		if (ev.code == 'KeyJ') {  // J is the only suppported key before deactivation
			document.getElementById('resultingValid').focus();
			window.scrollTo(0, 0);
		}
		else {  // Any other key, deactivate the select all
			document.getElementById('tableHeader').style.removeProperty("background");
			document.getElementById('selectalltop').querySelector('input.checkbox').checked = false;
			colorSelectAll(false);
			focusRowNumber = 0;
		}
	}
	if (focusRowNumber) {
		focusRow = document.getElementById('rowid' + focusRowNumber);
	} else {
		focusRowNumber = 0;
	}
	let direction = 'up';
	let handled = true;
	switch (ev.code) {
		case 'Home':
			setRowBackground(focusRowNumber);
			focusRowNumber = 0;
			while (firstDisplayedRow) {	// Skip if no rows displayed
				focusRowNumber++;
				focusRow = document.getElementById('rowid' + focusRowNumber);
				keepInView(focusRow, 'keyboardHandler');
				if (focusRow.style.display != 'none') {
					focusRow.style.background = focusColor;
					break;
				}
			}
			break;
		case 'End':
			setRowBackground(focusRowNumber);
			focusRowNumber = numRows + 1;
			while (firstDisplayedRow) {	// Skip if no rows displayed
				focusRowNumber--;
				focusRow = document.getElementById('rowid' + focusRowNumber);
				keepInView(focusRow, 'keyboardHandler');
				if (focusRow.style.display != 'none') {
					focusRow.style.background = focusColor;
					break;
				}
			}
			break;
		case 'ArrowDown':
			direction = 'down';
		case 'ArrowUp':
			if (focusRow) {
				setRowBackground(focusRowNumber);
			}

			while (firstDisplayedRow) {	// Skip if no rows displayed
				if (direction == 'down') {
					if (++focusRowNumber > lastDisplayedRow) {
						focusRowNumber = lastDisplayedRow;
					}
				} else {	// 'up'
					if (--focusRowNumber < firstDisplayedRow) {
						focusRowNumber = firstDisplayedRow;
						document.getElementById('tableHeader').style.backgroundColor = '#fe8';
						focusRow = document.getElementById('tableHeader');
						focusRowNumber = -1;
						colorSelectAll(true);
						break;
					}
				}
				focusRow = document.getElementById('rowid' + focusRowNumber);
				keepInView(focusRow, 'keyboardHandler');
				if (focusRowNumber && focusRow.style.display != 'none') {
					focusRow.style.background = focusColor;
					break;
				}
			}
			break;
		default:
			handled = false;
			break;
	}

	sessionStorage.setItem('focusRowNumber', focusRowNumber);

	if (!handled && focusRowNumber) {	// Only handle these keys if there is a focus row
		switch (ev.code) {
			case 'KeyX':
				let XcheckBox = document.getElementById('obsIds' + focusRowNumber);
				XcheckBox.checked = !XcheckBox.checked;	// toggle on/off
				setRowBackground(focusRowNumber);
				if (XcheckBox.checked) {
					XcheckBox.classList.add('Kchecked');
				} else {
					XcheckBox.classList.remove('Kchecked');
					document.getElementById('rowid' + focusRowNumber).style.background = focusColor;
				}
				break;
			case 'KeyJ':
				document.getElementById('resultingValid').focus();
				window.scrollTo(0, 0);
				break;
			case 'Enter':
				ev.preventDefault();
				toggleMediaRows(focusRow);
				break;
			case 'KeyS':
				hrefFromKey('.subID', 0, ev.ctrlKey);
				break;
			case 'KeyB':
				hrefFromKey('.species', 0, ev.ctrlKey);
				break;
			case 'KeyF':
				hrefFromKey('.details', 0, ev.ctrlKey);
				break;
			case 'KeyH':
				hrefFromKey('.details', 1, ev.ctrlKey);
				break;
			case 'KeyC':
				hrefFromKey('.KeBird', 0, ev.ctrlKey);
				break;
			case 'KeyQ':
				hrefFromKey('.user', 1, ev.ctrlKey);
				break;
			case 'KeyU':
				userWindow();
				break;
			case 'Escape':	// Disable keyboard focus
				setRowBackground(focusRowNumber);
				focusRowNumber = false;
				break;
			default:
//			console.log('Unhandled key: ' + ev.code);
		}
	}
}

function hrefFromKey(selector, index, ctrlKey) {  // Open a page according to the key pressed
	let td = focusRow.querySelector(selector);
	let a = td.querySelectorAll('A')[index];
	let target = '_blank';
	let href = a.getAttribute('href');
	if (href.substring(0, 8) != 'https://') {
		href = location.origin + '/admin/' + href
		target = ctrlKey ? '_blank' : '_self';
	}
	window.open(href, target);
}

function userWindow() { // Open the user window
	let td = focusRow.querySelector('.user');
	let a = td.querySelector('A');
	let onclick = a.getAttribute('onclick');
	let user = onclick.substring(onclick.indexOf("('") + 2);
	user = user.substring(0,user.indexOf("'"));
	let targetWindow = window.open(user, "poppedWindow", "toolbar=0,status=0,width=465,height=500,directories=0,scrollbars=1,location=0,resizable=1,menubar=0");
}

function setRowBackground(rowNumber) {	// set or remove focus color / select color
	if (document.getElementById('obsIds' + rowNumber)) {
		let Row = document.getElementById('rowid' + rowNumber);
		if (document.getElementById('obsIds' + rowNumber).checked) {
			Row.style.background = greenBackground;
		} else {
			Row.style.removeProperty("background");
		}
	}
}

function isMobile() {
	// True if screen is narrow (presumed mobile)
	return !window.matchMedia("(min-width: 48em)").matches;
}