"use strict";
// Provides several conveniences for the traditional review queue page.
const focusColor = '#eeddbb', greenBackground = '#ccf3b4';

if (window.location.href.includes('https://review.ebird.org/admin/review')) {  // matches review.htm, reviewObs.htm, and reviewSub.htm

	var lookup = {};	// global
	var focusRow, focusRowNumber, numRows = 0, mouseRow = 0, firstDisplayedRow, lastDisplayedRow;
	
	cssAdjustments();

	formListener();	// If there is a form, set up a submit listener to capture posted data.

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

function keyboardHandler(ev)
{
	if (document.activeElement.id == 'resultingValid' || document.activeElement.id == 'reasonCode'
		|| document.activeElement.id == 'notes' || document.activeElement.type == 'submit') {
		return; // If keyboard focus is in the top menu, do not proceed here.
	}
	if (focusRowNumber) {
		focusRow = document.getElementById('rowid' + focusRowNumber);
	} else {
		focusRowNumber = 0;
	}
	let originalRowNumber = focusRowNumber;
	let direction = 'up';
	let handled = true;
	switch (ev.code) {
		case 'Home':
			setRowBackground(focusRowNumber);
			focusRowNumber = 0;
			while (true) {
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
			while (true) {
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

			while (true) {
				if (direction == 'down') {
					if (++focusRowNumber > lastDisplayedRow) {
						focusRowNumber = lastDisplayedRow;
					}
				} else {	// 'up'
					if (--focusRowNumber < firstDisplayedRow) {
						focusRowNumber = firstDisplayedRow;
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
				document.getElementById('obsIds' + focusRowNumber).checked = XcheckBox.checked ? false : true;
				setRowBackground(focusRowNumber);
				if (!XcheckBox.checked) {
					document.getElementById('rowid' + focusRowNumber).style.background = focusColor;
				}
				break;
			case 'KeyJ':
				document.getElementById('resultingValid').focus();
				window.scrollTo(0, 0);
				break;
			case 'Enter':
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

function colorSelectAll() {	// Set row background color when select all is toggled
	let mainTable = document.getElementById('contents');
	mainTable.querySelectorAll('tr').forEach(function (elTr) {
		let td = elTr.querySelector('td');
		if (td) {
			let input = td.querySelector('input');
			if (input) {
				let rowNumber = input.id.substring(6);
				setRowBackground(rowNumber);
				if (rowNumber == focusRowNumber) {
					document.getElementById('rowid' + rowNumber).style.background = focusColor;
				}
			}
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
		changeButton[changeButton.length-1].addEventListener('focus', (ev) => {
			ev.target.style.background = '#0d0';
		});
		changeButton[changeButton.length - 1].addEventListener('blur', (ev) => {
			ev.target.style.background = '#090';
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
			localStorage.setItem('lastChange', obsList.join());	// Save for later
		});
	}
}

function regularReview() {
	let mainTable = document.getElementById('contents');
	let hyperlink = [];
	hyperlink['Download'] = '';
	hyperlink['Toggle'] = '';
	if (mainTable) {	// If we have a table of records, e.g., not "Congratulations! You have no more records to review"
		document.addEventListener('keydown', (ev) => { keyboardHandler(ev); });
		performDeferToggle(mainTable);
		hyperlink['Download'] = buildCSV(mainTable);	//	First set up the CSV download
		hyperlink['Toggle'] = setupToggleDeferred(mainTable);	// Set up "Toggle deferred" hyperlink
		mainTable.insertBefore(createRecallText(), mainTable.firstElementChild);	// Set up recall output
		// Handler for when select all is checked
		mainTable.querySelector('th').addEventListener('change', () => { setTimeout(colorSelectAll, 100); });
	} else {	// Special case when review queue is empty, "Congratulations! You have no more records to review"
		let oopsText = createRecallText();
		oopsText.style.position = 'absolute';
		oopsText.style.left = '230px';
		oopsText.style.top = '175px';
		document.getElementById('listnav').insertBefore(oopsText, null);
	}
	hyperlink['DocList'] = makeDocList();	// Set up reviewer documents hyperlink
	hyperlink['Recall'] = createOopsControl();	// Create recall hyperlink
	
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
	hyperlink['WhatsNew'].appendChild(document.createTextNode("What's New, take 2"));
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

function pulldownHyperlinks(hyperlink) {

	// Create a paragraph to contain the pulldown button
	let hyperlinkPulldownButton = document.createElement('p');
	hyperlinkPulldownButton.setAttribute('id', 'PullDown');
	hyperlinkPulldownButton.setAttribute("class", "toggler");
	hyperlinkPulldownButton.textContent = "Add-ons";
	hyperlinkPulldownButton.style.color = '#3366cc';

	document.getElementById("listnav").insertBefore(hyperlinkPulldownButton, null);

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
	hyperlinkDiv.style.backgroundColor = '#edf4fe';
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

	addonLink(addonUL, hyperlink['Recall'], true, hyperlinkDiv);
	addonLink(addonUL, hyperlink['Toggle'], false, hyperlinkDiv);
	addonLink(addonUL, hyperlink['DocList'], true, hyperlinkDiv);
	addonLink(addonUL, hyperlink['Download'], true, hyperlinkDiv);
	addonLink(addonUL, hyperlink['Extension'], true, hyperlinkDiv);
	addonLink(addonUL, hyperlink['WhatsNew'], true, hyperlinkDiv);

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

function addonLink(addonUL, addon, clear, hyperlinkDiv) {
	if (addon) {
		let item = document.createElement('li');
		item.style.lineHeight = '30px';
		item.style.paddingLeft = '2em';
		item.style.textIndent = '-2em';
		addonUL.appendChild(item);
		item.appendChild(addon);
		if (clear) {
			addon.addEventListener('click', function () {
				hyperlinkDiv.style.display = 'none';
			});
		}
	}
}

function createOopsControl() {
	// Create a paragraph to contain the hyperlink
	// We are going to build <a id=oopsAnchor href=# class=toggler>Recall</a>
	// Create an anchor element
	let oopsAnchor = document.createElement('a');	// This is the actual toggle hyperlink
	oopsAnchor.setAttribute("id", 'oopsAnchor');		// Not actually used
	oopsAnchor.appendChild(document.createTextNode("Recall"));
	oopsAnchor.setAttribute("href", "#");

	// This function will execute when oopsAnchor is clicked.
	// It toggles the display status of previously updated records.
	oopsAnchor.onclick = function () {
		let oops = document.getElementById('oopsText');
		if (oops.style.display === 'none') {
			oops.style.display = 'block';
		} else {
			oops.style.display = 'none';
		}
	}
	return (oopsAnchor);
}

function createRecallText() {
	let obsList = localStorage.getItem('lastChange');	// Get the content for the list of observations
	let obsArray = [];
	if (obsList) {
		obsArray = obsList.split(",");
	} else {
		obsArray[0] = 'None';
	}

	let oopsText = document.getElementById('oopsText');	// Clear the previous output
	if (oopsText) oopsText.remove;

	// We are going to build <p id=oopsText style='display:none margin-bottom:1em'>Previously changed records:
	// <a target=_blank href=https://review.ebird.org/admin/reviewObs.htm?obsID=OBS1>OBS1</a> [, OBS2] ... </p>
	oopsText = document.createElement('p');	// Paragraph to contain the list of observations
	oopsText.setAttribute('id', 'oopsText');
	oopsText.style.display = 'none';	// Initially it is not displayed
	oopsText.style.marginBottom = '1em';
	oopsText.style.fontSize = '13px';
	oopsText.appendChild(document.createTextNode('Previously changed records: '));

	let oopsTextAnchor, pieces, obsID, taxon = '';
	for (let obs = 0; obs < obsArray.length; obs++) {
		if (obsArray[0] === 'None') {
			oopsText.appendChild(document.createTextNode('None'));
			break;
		} else {	// Set up the hyperlink for this observation
			pieces = obsArray[obs].split('/');
			obsID = pieces[0];
			if (pieces.length > 1) {
				taxon = obsArray[obs].substring(obsID.length + 1);	// Might be a slash in the name, can't use split
			} else {
				taxon = '';
			}

			oopsTextAnchor = document.createElement('a');
			if (taxon) {
				oopsTextAnchor.appendChild(document.createTextNode(taxon));
			} else {
				oopsTextAnchor.appendChild(document.createTextNode(obsArray[obs]));
			}
			oopsTextAnchor.setAttribute('target', '_blank');
			oopsTextAnchor.setAttribute('href', 'https://review.ebird.org/admin/qr.htm?obsId=' + obsID);

			oopsText.appendChild(oopsTextAnchor);
			if (obs + 1 < obsArray.length)	// Make the list comma-separated
				oopsText.appendChild(document.createTextNode(', '));
		}
	}
	return oopsText;
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
	let Emonth = (month < 12) ? month + 1 : 1;
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
		docDiv.style.left = '450px';
		docDiv.style.top = '120px';
		docDiv.style.border = 'medium solid ' + greenBackground;
		docDiv.style.width = '15em';
		docDiv.style.backgroundColor = '#edf4fe';
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
		let speciesCell;

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
					// Extra steps for background coloring, not part of building CSV.
					let checkBoxId = el.getAttribute('id');
					let rowNumber = checkBoxId.substring(6);
					el.addEventListener('change', () => { setRowBackground(rowNumber) });
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
					break;
				case "subID":
					// "subID" column, get the report subID and set up the eBird checklist URL
					if (el.nodeName === 'A') {
						subid = el.innerHTML;
						checklist = 'https://ebird.org/checklist/' + subid
					}
					break;
				case "species":
					// "species" column, get the species name
					if (el.nodeName === 'LABEL') {
						species = el.textContent.trim();
						lookup[OBS] = species;
						speciesCell = Cell;
					}
					break;
				case "evidence":
					mediaCell = document.createElement('td');
					elTr.insertBefore(mediaCell, Cell);
					setupMedia(elTr, mediaCell, OBS);
					if (html) {
						// "evidence" column, get the code letter for type of details
						if (el && el.nodeName === 'A') {
							let ev = parser.parseFromString(el.innerHTML, "text/html");
							evidence = ev.body.firstChild.innerHTML;
						}
					}
					break;
				case "count": count = Cell.innerHTML;
					break;
				case "obsdate": {
					// Get the observation date, also format a copy of the date as day of year (without the year)
					obsdate = Cell.innerHTML;
					let date = new Date(obsdate);
					let day = String(date.getDate()).padStart(2, '0');
					let month = String(date.getMonth() + 1).padStart(2, '0');
					dayOfYear = month + ' ' + day;
				}
					break;
				case "user":	// Get the user's name
					if (el.nodeName === 'A' && el.getAttribute('class') === 'userprofile') {
						user = el.innerHTML;
					}
					break;
				case "locname": locname = Cell.innerHTML;
					break;
				case "county": county = Cell.innerHTML;
					break;
				case "state":
					if (el.nodeName === '#text') {
						state = el.nodeValue;
					}
					break;
				case "validity": validity = Cell.textContent;
					break;
				case "status": status = Cell.textContent;
					if (status == 'Deferred') {	// Gray out species name on deferred record
						let speciesAnchor = speciesCell.querySelector('a');
						speciesAnchor.style.color = '#aaa';
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
	let mainType = document.getElementById("screentitle").getElementsByTagName("h2")[0].textContent; // "Search Results" or "Review Observations"
	if (mainType == 'Search Results') {
		let Fwebring = document.getElementById("listnav").querySelector('.webring');
		if (Fwebring) {
			let rangeText = Fwebring.getElementsByTagName("p")[0].textContent;	// result count
			// Parse out the tokens from result count
			let tokens = rangeText.split(" ");
			let rangeEnd = tokens[tokens.length - 1];
			let rangeStart = tokens[tokens.length - 3];
			let actualRangeEnd = Number(rangeStart) + rowCounter - 1;
			let actualRange = rangeStart + " - " + actualRangeEnd;

			if (rangeEnd !=  actualRangeEnd ) {
				let countPara = document.createElement('p');	// Create new paragraph to contain actual result count
				let countText = document.createTextNode('Actually showing ' + actualRange);
				countPara.appendChild(countText);
				// Insert new paragraph before the second paragraph
				Fwebring.insertBefore(countPara, Fwebring.querySelectorAll('p')[1]);
			}
		}
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
	let response = await fetch('https://review.ebird.org/admin/reviewServices/getObsComments.do?obsId=' + OBS);
	let comments = await response.text();
	comments = comments.replace(/\\"/g, '"');	// unescape internal quotes
	comments = comments.slice(1, comments.length - 1);	// strip enclosing quotes.

	if (comments.length) {
		commentTD.textContent = comments;
		let mediaIcon = document.createElement('i');
		mediaIcon.setAttribute('class', 'icon icon-ev-N');
		mediaIcon.appendChild(document.createTextNode('N'));
		mediaCell.appendChild(mediaIcon);
	}

	let mediaType = '';
	response = await fetch('https://review.ebird.org/admin/reviewServices/getObsMedia.do?obsId=' + OBS);

	let json = await response.json();
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

function setupToggleDeferred(mainTable) {	// Set up "Toggle deferred" hyperlink
	// Set up a div to display the toggle status
	let toggleStatusDiv = document.createElement('div');
	toggleStatusDiv.setAttribute("id", 'toggleStatusDiv');
	toggleStatusDiv.style.position = 'absolute';
	toggleStatusDiv.style.left = '300px';
	toggleStatusDiv.style.top = '70px';
	toggleStatusDiv.style.border = 'medium solid ' + greenBackground; 
	toggleStatusDiv.style.backgroundColor = '#edf4fe';
	toggleStatusDiv.style.padding = '1em';
	toggleStatusDiv.style.display = 'none';
	toggleStatusDiv.style.zIndex = 1;
	document.getElementById("listnav").appendChild(toggleStatusDiv);
	let toggleStatus = document.createElement('p');	// Paragraph for displaying toggle status
	toggleStatusDiv.appendChild(toggleStatus);
	toggleStatus.setAttribute('id', 'toggleStatus');

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

	let recordCount = 0;
	firstDisplayedRow = -1;
	for (let i = 0; i < reviewRows.length; i++) {
		switch (deferToggle) {
			case 0:	// Display all rows
				reviewRows[i].parentNode.style.display = 'table-row';
				lastDisplayedRow = i;
				if (firstDisplayedRow < 0) { firstDisplayedRow = i }
				recordCount++;
				break;
			case 1:	// Display only non-deferred observations
				if (reviewRows[i].classList.contains('deferred')) {
					reviewRows[i].parentNode.style.display = 'none';
				}
				else {
					reviewRows[i].parentNode.style.display = 'table-row';
					lastDisplayedRow = i;
					if (firstDisplayedRow < 0) { firstDisplayedRow = i }
				}
				recordCount++;
				break;
			case 2:	// Display only Deferred observations
				if (reviewRows[i].classList.contains('deferred')) {
					reviewRows[i].parentNode.style.display = 'table-row';
					lastDisplayedRow = i;
					if (firstDisplayedRow < 0) { firstDisplayedRow = i }
				}
				else {
					reviewRows[i].parentNode.style.display = 'none';
				}
				recordCount++;
				break;
			case 3:	// Display only inreview rows
				if (reviewRows[i].classList.contains('inreview')) {
					reviewRows[i].parentNode.style.display = 'table-row';
					lastDisplayedRow = i;
					if (firstDisplayedRow < 0) { firstDisplayedRow = i }
					recordCount++;
				}
				else {
					reviewRows[i].parentNode.style.display = 'none';
				}
				break;
			default:
		}
	}
	lastDisplayedRow++; // zero-based to one-based;
	firstDisplayedRow++;
	if (recordCount==0 && deferToggle==3) { // Rereview records are not present so continue to all records
		sessionStorage.setItem('deferToggle', 0);
		performDeferToggle(mainTable);
	}
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
