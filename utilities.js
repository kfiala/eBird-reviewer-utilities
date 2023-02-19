"use strict";
// Provides several unrelated conveniences for the traditional review queue page.
//
// 1. Provides a hyperlink for downloading the displayed queue or search report in CSV format.
// 2. Provides a hyperlink to the eBird checklist for each report.
// 3. Provides a hyperlink for toggling display of Deferred reports on or off.
// 4. Adjusts the widths of "Review decision", "Reason code", and "Notes" inputs to reasonable values.
// 5. Preserves links to last observations updated.

if (window.location.href.includes('https://review.ebird.org/admin/review')) {  

	var lookup = {};	// global

	widthAdjustment();	// Adjust widths of some input fields

	formListener();	// If there is a form, set up a submit listener to capture posted data.

	//
	// Check if we have listnav, and if so get its webring element.
	// This will be true for regular review (normal or exotic) but not for history or submission review
	//
	var Fwebring='';
	if (document.getElementById("listnav")) {
		Fwebring = document.getElementById("listnav").querySelector('.webring');
	}

	if (Fwebring) {	// If we are in regular review 
		regularReview();
	} else if (location.pathname == '/admin/reviewObs.htm') {	// History window
		historyWindow();
	} else if (location.pathname == '/admin/reviewSub.htm') {	// Submission window
		submissionWindow();
	}
}
///////////	End of mainline code

function widthAdjustment() {	// Adjust the widths of "Review decision", "Reason", and "Notes" inputs

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
	if (mainTable) {	// If we have a table of records, e.g., not "Congratulations! You have no more records to review"
		buildCSV(mainTable);	//	First set up the CSV download
		setupToggleDeferred(mainTable);	// Set up "Toggle deferred" hyperlink
		mainTable.insertBefore(createRecallText(), mainTable.firstElementChild);	// Set up recall output
	} else {	// Special case when review queue is empty, "Congratulations! You have no more records to review"
		document.getElementById('listnav').insertBefore(createRecallText(), null);
	}
	createOopsControl();	// Create recall hyperlink
	makeDocList();	// Set up reviewer documents hyperlink
}

function createOopsControl() {
	// Create a paragraph to contain the hyperlink and add it to the "listnav" list
	// We are going to build <p id=oopsControl><a id=oopsAnchor href=# class=toggler>Recall</a></p>
	let oopsControlP = document.createElement('p');		// Paragraph to contain the toggle hyperlink
	oopsControlP.setAttribute('id','oopsControl');
	document.getElementById("listnav").insertBefore(oopsControlP,Fwebring);	// Add it to the list at the top

	// Create an anchor element
	let oopsAnchor = document.createElement('a');	// This is the actual toggle hyperlink
	oopsAnchor.setAttribute("id",'oopsAnchor');		// Not actually used
	oopsAnchor.appendChild(document.createTextNode("Recall"));
	oopsAnchor.setAttribute("href","#");
	oopsAnchor.setAttribute("class","toggler");
	oopsControlP.appendChild(oopsAnchor);	// Put the hyperlink in its paragraph

	// This function will execute when oopsAnchor is clicked.
	// It toggles the display status of previously updated records.
	oopsAnchor.onclick=function(){
		let oops = document.getElementById('oopsText');
		if (oops.style.display === 'none') {
			oops.style.display = 'block';
		} else {
			oops.style.display = 'none';
		}
	}
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
	oopsText.setAttribute('id','oopsText');
	oopsText.style.display = 'none';	// Initially it is not displayed
	oopsText.style.marginBottom = '1em';
	oopsText.style.fontSize = '13px';
	oopsText.appendChild(document.createTextNode('Previously changed records: '));

	let oopsTextAnchor, pieces, obsID, taxon = '';
	for (let obs=0; obs<obsArray.length; obs++) {
		if (obsArray[0] === 'None') {
			oopsText.appendChild(document.createTextNode('None'));
			break;
		} else {	// Set up the hyperlink for this observation
			pieces = obsArray[obs].split('/');
			obsID = pieces[0];
			if (pieces.length > 1) {
				taxon = obsArray[obs].substring(obsID.length+1);	// Might be a slash in the name, can't use split
			} else {
				taxon = '';
			}

			oopsTextAnchor = document.createElement('a');
			if (taxon) {
				oopsTextAnchor.appendChild(document.createTextNode(taxon));
			} else {
				oopsTextAnchor.appendChild(document.createTextNode(obsArray[obs]));
			}
			oopsTextAnchor.setAttribute('target','_blank');
			oopsTextAnchor.setAttribute('href','https://review.ebird.org/admin/qr.htm?obsId=' + obsID);

			oopsText.appendChild(oopsTextAnchor);
			if (obs+1 < obsArray.length)	// Make the list comma-separated
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
	map.setAttribute('style','float:right');
	map.setAttribute('target','_blank');
//	Insert hyperlink at top right
	document.getElementById('reviewForm').insertBefore(map,document.getElementById('submissiondetails'));

//	Get the numeric month of the observation date from the ISO date
	const month = parseInt(ISOdate.split('-')[1]);
	let Bmonth = (month > 1) ? month - 1 : 12;
	let Emonth = (month < 12) ? month + 1 : 1;
	let URLend = 
		'&bmo=' + Bmonth +
		'&emo=' + Emonth +
		'&zh=true&gp=true';

	map.setAttribute('href',URL + URLend);
}

function makeDocList() {	// Prepare the clickable list of reviewer docs
	if (!document.body.contains(document.getElementById('listDocsID'))) {	// Create this paragraph only if not already done
		// Create a paragraph to contain the hyperlink and add it to the "listnav" list
		let listDocsLI = document.createElement('p');
		listDocsLI.setAttribute('id', 'listDocsID');
		document.getElementById("listnav").insertBefore(listDocsLI, Fwebring);

		// Create an anchor element
		let ae = document.createElement('a');
		ae.setAttribute("id", 'toglDocsAnchor');
		ae.appendChild(document.createTextNode("Reviewer docs"));
		ae.setAttribute("href", "#");
		ae.setAttribute("class", "toggler");
		listDocsLI.appendChild(ae);

		// Create a div to contain the list
		let docDiv = document.createElement('div');
		docDiv.setAttribute("id", 'docDiv');
		docDiv.style.position = 'absolute';
		docDiv.style.left = '450px';
		docDiv.style.top = '120px';
		docDiv.style.border = 'medium solid #CCF3B4';
		docDiv.style.width = '15em';
		docDiv.style.backgroundColor = '#edf4fe';
		docDiv.style.paddingTop = '1em';
		docDiv.style.paddingBottom = '1em';
		docDiv.style.display = 'none';
		docDiv.style.zIndex = 1;
		document.getElementById("listnav").appendChild(docDiv);

		docDiv.addEventListener('click',  () => {	// Close the document list when it is clicked on
			document.getElementById('docDiv').style.display = 'none';
		});

		if (document.getElementById('contents')) {
			document.getElementById('contents').addEventListener('click', () => {	// Close the document list when table is clicked on
				document.getElementById('docDiv').style.display = 'none';
			});
		}	

		// Create the unordered list of links
		let docUL = document.createElement('ul');
		docUL.style.listStyle = 'none';
		docUL.style.marginLeft = '15px';
		docDiv.appendChild(docUL);

		let URLlist = [['eBird Reviewer Handbook','https://drive.google.com/file/d/1zeGEwMt9vrJL3dvj1aAuYodErB8ikl3e/view?usp=share_link'],
			['eBird Regional Editors','https://docs.google.com/spreadsheets/d/1i08drC6kGqequ_uRB6vgRdMaClcTljX0pvDzSS0ARic/edit#gid=124519153'],
			['Exotics and taxonomy files', 'https://drive.google.com/drive/folders/1CzYzrR4DOMWpTxPnafvqjBw77JcTUcJr'],
			['Filter taxa recommendations', 'https://docs.google.com/spreadsheets/d/1p-VRE2GhUuJXv6ADUehw7tlVLauYB7YI/edit#gid=446487343'],
			['All documents', 'https://drive.google.com/drive/folders/1LtQA_2lbKyjQ4aDpPwUTPCgRWcQISa7u']];

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
		ae.addEventListener('click', function () {
			let docDiv = document.getElementById('docDiv');
			if (docDiv.style.display == 'block') {
				docDiv.style.display = 'none';
			} else {
				docDiv.style.display = 'block';
			}
		});
	}
}

function buildCSV(mainTable) { 	//	set up the CSV download
	let spreadSheet = [];
	let doHeaders = true;
	let headers = [];
	let rownum = 0;
	const parser = new DOMParser();

	mainTable.querySelectorAll('tr').forEach(function (elTr) {
		// Extract the data from each row of the queue/search
		let row = [];
		let subid, species, evidence, count, obsdate, user, locname, county, state, validity, status, dayOfYear;
		let checklist, chklstCell, chklstLink;
		let OBS;

		elTr.querySelectorAll('td').forEach(function (Cell) {
			// Look at each column cell in this row of the table
			let Class = Cell.getAttribute('class').split(' ')[0];
			let html = parser.parseFromString(Cell.innerHTML, "text/html");
			let el = html.body.firstChild;

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
					}
					break;
				case "evidence": if (html) {
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
				case "validity": validity = Cell.innerHTML;
					break;
				case "status": status = Cell.innerHTML;
					break;
				case "details": break;	// Don't keep anything from "details" column
			}
		});
		if (rownum++) {	// Skip row 0 (headers)
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
	// All done building the CSV, now set up the hyperlink for it.
	let downloadPara = document.getElementById('DownloadCSV');
	let a;
	if (!document.body.contains(downloadPara)) {	// Create this paragraph only if not already done
		// Set up a paragraph (p element) to contain the hyperlink
		let downloadLi = document.createElement('p');
		downloadLi.setAttribute('id', 'DownloadCSV');
		// Add the paragraph to the existing list of hyperlinks
		document.getElementById("listnav").insertBefore(downloadLi, Fwebring);

		// Create the anchor element to go in the paragraph
		a = document.createElement('a');
		a.setAttribute("id", 'dlAnchor');
		a.appendChild(document.createTextNode("Download csv"));
		a.setAttribute("download", 'eBird report.csv');	// Set the csv file name
		a.setAttribute("class", "toggler");
		downloadLi.appendChild(a);
	}
	else {
		a = document.getElementById('dlAnchor');
	}
	// Hook up the CSV data to the hyperlink
	a.href = window.URL.createObjectURL(new Blob(['\ufeff', spreadSheet.join('\r\n')], { type: 'text/csv' }));
	// All done with the CSV stuff, now on to the next feature
}

function setupToggleDeferred(mainTable) {	// Set up "Toggle deferred" hyperlink
	let toglStatusPara = document.getElementById('toglStatusID');
	let deferToggle;
	if (!document.body.contains(toglStatusPara)) {	// Create this paragraph only if not already done
		// Create a paragraph to contain the hyperlink and add it to the "listnav" list
		let toglStatusLi = document.createElement('p');
		toglStatusLi.setAttribute('id', 'toglStatusID');
		document.getElementById("listnav").insertBefore(toglStatusLi, Fwebring);

		// Create an anchor element
		let ae = document.createElement('a');
		ae.setAttribute("id", 'toglStatusAnchor');
		ae.appendChild(document.createTextNode("Toggle deferred"));
		ae.setAttribute("href", "#");
		// This function will execute when "Toggle deferred" is clicked.
		// It toggles the display status of deferred reports.
		ae.onclick = function () {
			if (deferToggle === undefined) {
				deferToggle = 0;
			}
			deferToggle = ++deferToggle % 3;	// Cycle through three different view

			let reviewRows = document.getElementsByClassName('status');	// Each row is an observation in the queue

			let checkAll = mainTable.querySelector('input.checkbox');
			switch (deferToggle) {
				case 1:
				case 2:
					checkAll.disabled = true;
					break;
				default:
					checkAll.disabled = false;
			}

			for (let i = 0; i < reviewRows.length; i++) {
				switch (deferToggle) {
					case 0:	// Display all rows
						reviewRows[i].parentNode.style.display = 'table-row';
						break;
					case 1:	// Display only non-deferred observations
						if (reviewRows[i].classList.contains('deferred')) {
							reviewRows[i].parentNode.style.display = 'none';
						}
						else {
							reviewRows[i].parentNode.style.display = 'table-row';
						}
						break;
					case 2:	// Display only Deferred observations
						if (reviewRows[i].classList.contains('deferred')) {
							reviewRows[i].parentNode.style.display = 'table-row';
						}
						else {
							reviewRows[i].parentNode.style.display = 'none';
						}
						break;
					default:
				}
			}
		}
		ae.setAttribute("class", "toggler");
		toglStatusLi.appendChild(ae);
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