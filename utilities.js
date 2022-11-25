"use strict";
// Provides several unrelated conveniences for the traditional review queue page.
//
// 1. Provides a hyperlink for downloading the displayed queue or search report in CSV format.
// 2. Provides a hyperlink to the eBird checklist for each report.
// 3. Provides a hyperlink for toggling display of Deferred reports on or off.
// 4. Adjusts the widths of "Review decision", "Reason code", and "Notes" inputs to reasonable values.
// 5. Preserves links to last observations updated.

var deferToggle;
//
// Establish whether we are in review mode or exotics mode, or neither.
// Review mode includes both regular review (review.htm) and history review (reviewObs.htm)
// Both review queue and search results can be either review or exotics.
//
let reviewMode;
if (document.getElementById('bulkactions')) {
	reviewMode = document.getElementById('bulkactions').getAttribute('class'); //'exotic' or 'actionbar-fixed'
} else {
	reviewMode = 'no records';
}

//
// Adjust the widths of "Review decision", "Reason", and "Notes" inputs
//
switch (reviewMode) {
	case 'exotic':
		document.getElementById('newExoticCategory').style='width:125px';
		document.getElementById('notes').style='width:300px';
		break;
	case 'actionbar-fixed':
		document.getElementById('resultingValid').style='width:160px';
		document.getElementById('reasonCode').style='width:300px';
		document.getElementById('notes').style='width:300px';
		break;
	default:
}

//
// If there is a form, set up a submit listener to capture posted data.
//
if (document.getElementById('reviewForm')) {
	document.querySelector('#reviewForm').addEventListener('submit', (e) => {
		// This function runs on an update submit, to capture the submitted data.
		const data = new FormData(e.target);
		localStorage.setItem('lastChange',data.getAll('obsIds'));	// Save for later
	});
}

//
// Check if we have listnav, and if so get its webring element.
// This will be true for regular review and exotic review but not for history review
//
var Fwebring='';
if (document.getElementById("listnav")) {
	Fwebring = document.getElementById("listnav").querySelector('.webring');
}

if (Fwebring) {	// If we are in regular review or exotic review
	var mainTable = document.getElementById('contents');
	if (mainTable) {	// If we have a table of records, e.g., not "Congratulations! You have no more records to review"
	//	First set up the CSV download
		var spreadSheet = [];
		var doHeaders = true;
		var headers = [];
		var rownum = 0;

		mainTable.querySelectorAll('tr').forEach(function(elTr) {
			// Extract the data from each row of the queue/search
			var row = [];
			var subid, species, evidence, count, obsdate, user, locname, county, state, validity, status, dayOfYear;
			var checklist, chklstCell, chklstLink;
			const parser = new DOMParser();

			elTr.querySelectorAll('td').forEach(function(Cell) {
				// Look at each column cell in this row of the table
				var Class = Cell.getAttribute('class').split(' ')[0];
				var html = parser.parseFromString(Cell.innerHTML,"text/html");
				var el = html.body.firstChild;

				if (doHeaders &&  (Class !== 'select') &&  (Class !== 'details')) {
					// In the first row, save the headers of the columns that we are going to keep;
					// also create and save header of the new day of year column we will create
					headers.push(Class);
					if (Class === 'obsdate') {
						headers.push('day of year');
					}
				}
				switch  (Class) {
					case "select":
						// "select" column, do nothing
					break;
					case "subID": {
						// "subID" column, get the report subID and set up the eBird checklist URL
						if (el.nodeName === 'A') {
							subid = el.innerHTML;
							checklist = 'https://ebird.org/checklist/' + subid
						}
					}
					break;
					case "species": {
						// "species" column, get the species name
						if (el.nodeName === 'LABEL') {
							species = el.textContent;
						}
					}
					break;
					case "evidence": if (html) {
						// "evidence" column, get the code letter for type of details
						if (el && el.nodeName === 'A') {
							var ev = parser.parseFromString(el.innerHTML,"text/html");
							evidence = ev.body.firstChild.innerHTML;
						}
					}
					break;
					case "count": count = Cell.innerHTML;
					break;
					case "obsdate":
						// Get the observation date, also format a copy of the date as day of year (without the year)
						obsdate = Cell.innerHTML;
						var date = new Date(obsdate);
						var day = String(date.getDate()).padStart(2,'0');
						var month = String(date.getMonth()+1).padStart(2,'0');
						dayOfYear = month + ' ' + day;
					break;
					case "user":
					{	// Get the user's name
						if (el.nodeName === 'A' && el.getAttribute('class') === 'userprofile') {
							user = el.innerHTML;
						}
					}
					break;
					case "locname": locname = Cell.innerHTML;
					break;
					case "county": county = Cell.innerHTML;
					break;
					case "state": {
						if (el.nodeName === '#text') {
							state = el.nodeValue;
						}
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
				chklstCell.setAttribute('class','KeBird');
				chklstCell.setAttribute('style','color:#ccc');
				elTr.appendChild(chklstCell);

				chklstLink = document.createElement('a');
				chklstCell.appendChild(chklstLink);
				chklstLink.appendChild(document.createTextNode('ebird'));
				chklstLink.setAttribute('href',checklist);
				chklstLink.setAttribute('target','_blank');
			}
		});
		// All done building the CSV, now set up the hyperlink for it.
		var downloadPara = document.getElementById('DownloadCSV');
		var a;
		if (!document.body.contains(downloadPara)) {	// Create this paragraph only if not already done
			// Set up a paragraph (p element) to contain the hyperlink
			var downloadLi = document.createElement('p');
			downloadLi.setAttribute('id','DownloadCSV');
			// Add the paragraph to the existing list of hyperlinks
			document.getElementById("listnav").insertBefore(downloadLi,Fwebring);

			// Create the anchor element to go in the paragraph
			a = document.createElement('a');
			a.setAttribute("id",'dlAnchor');
			a.appendChild(document.createTextNode("Download csv"));
			a.setAttribute("download",'eBird report.csv');	// Set the csv file name
			a.setAttribute("class","toggler");
			downloadLi.appendChild(a);
		}
		else {
			a = document.getElementById('dlAnchor');
		}
		// Hook up the CSV data to the hyperlink
		a.href=window.URL.createObjectURL(new Blob(['\ufeff',spreadSheet.join('\r\n')],{type:'text/csv'}));
		// All done with the CSV stuff, now on to the next feature
	// -------------------------------------------------------------------
		// Set up "Toggle deferred" hyperlink
		var toglStatusPara = document.getElementById('toglStatusID');
		if (!document.body.contains(toglStatusPara)) {	// Create this paragraph only if not already done
			// Create a paragraph to contain the hyperlink and add it to the "listnav" list
			var toglStatusLi = document.createElement('p');
			toglStatusLi.setAttribute('id','toglStatusID');
			document.getElementById("listnav").insertBefore(toglStatusLi,Fwebring);

			// Create an anchor element
			var ae = document.createElement('a');
			ae.setAttribute("id",'toglStatusAnchor');
			ae.appendChild(document.createTextNode("Toggle deferred"));
			ae.setAttribute("href","#");
			// This function will execute when "Toggle deferred" is clicked.
			// It toggles the display status of deferred reports.
			ae.onclick=function(){
				if (deferToggle === undefined) {
					deferToggle = 0;
				}
				deferToggle = ++deferToggle % 3;	// Cycle through three different view

				var reviewRows = document.getElementsByClassName('status');	// Each row is an observation in the queue

				var checkAll = mainTable.querySelector('input.checkbox');
				switch(deferToggle) {
					case 1:
					case 2:
						checkAll.disabled = true;
						break;
					default:
						checkAll.disabled = false;
				}

				for (var i=0; i<reviewRows.length; i++) {
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
			ae.setAttribute("class","toggler");
			toglStatusLi.appendChild(ae);
		}
	// -------------------------------------------------------------------
		// Next feature: Set up for "oops"
		createOopsControl();
		mainTable.insertBefore(createRecallText(),mainTable.firstElementChild);	// Insert in front of the table
	} else {	// Special case when review queue is empty, "Congratulations! You have no more records to review"
		createOopsControl();
		document.getElementById('listnav').insertBefore(createRecallText(),null);
	}
} else {	// History screen
	const dparser = new DOMParser();
//	From, e.g.,
//<h3 class="obsreview_species"><a href="https://birdsoftheworld.org/bow/species/snogoo/cur/introduction">Snow Goose</a>
//<h3 class="obsreview_species"><a href="https://ebird.org/species/passer1">passerine sp.</a>
//	parse out snogoo or passer1
	const anchor = document.querySelector('.obsreview_species').innerHTML;
	const urlPieces = dparser.parseFromString(anchor,"text/html").body.firstChild.href.split('/');
	let sixcode='';
	for (let up=0; up < urlPieces.length; up++) {
		if (urlPieces[up] === 'species') {
			sixcode = urlPieces[up+1];
			break;
		}
	}

//	Now within obsreview_table, from e.g,
//	<td class="name"><a target="_blank" href="https://www.google.com/maps/place/35.727862,-78.776077">
//	parse out 35.727862,-78.776077
	const tr = document.querySelector('.obsreview_table').querySelectorAll('td')[1].innerHTML;
	const coords = dparser.parseFromString(tr,'text/html').body.firstChild.href.split('/')[5].split(',');
	const Y = parseFloat(coords[0]);
	const X = parseFloat(coords[1]);
//	Also get the numeric month of the observation date	
	const dateString = document.querySelector('.obsreview_status').textContent;
	const date  = new Date(dateString);
	const month = date.getMonth()+1;
//	Set up the URL for the species map
	const URL = 'https://ebird.org/map/' + sixcode + '?neg=false'+
		'&env.minX=' + (X-0.5) +
		'&env.minY=' + (Y-0.5) +
		'&env.maxX=' + (X+0.5) +
		'&env.maxY=' + (Y+0.5) +
		'&bmo=' + month +
		'&emo=' + month +
		'&zh=true&gp=true';
//	Create the anchor for the map
	const map = document.createElement('a');
	map.appendChild(document.createTextNode('eBird species map'));
	map.setAttribute('style','float:right');
	map.setAttribute('href',URL);
	map.setAttribute('target','_blank');
//	Insert hyperlink at top right
	document.getElementById('reviewForm').insertBefore(map,document.getElementById('submissiondetails'));
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
	// It toggles the display status of deferred reports.
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
	if (oopsText) document.remove(oopsText);

	// We are going to build <p id=oopsText style='display:none margin-bottom:1em'>Previously changed records:
	// <a target=_blank href=https://review.ebird.org/admin/reviewObs.htm?obsID=OBS1>OBS1</a> [, OBS2] ... </p>
	oopsText = document.createElement('p');	// Paragraph to contain the list of observations
	oopsText.setAttribute('id','oopsText');
	oopsText.style.display = 'none';	// Initially it is not displayed
	oopsText.style.marginBottom = '1em';
	oopsText.appendChild(document.createTextNode('Previously changed records: '));

	let oopsTextAnchor;
	for (var l=0; l<obsArray.length; l++) {
		if (obsArray[0] === 'None') {
			oopsText.appendChild(document.createTextNode('None'))
		} else {	// Set up the hyperlink for this observation
			oopsTextAnchor = document.createElement('a');
			oopsTextAnchor.appendChild(document.createTextNode(obsArray[l]));
			oopsTextAnchor.setAttribute('target','_blank');
			oopsTextAnchor.setAttribute('href','https://review.ebird.org/admin/reviewObs.htm?obsID=' + obsArray[l]);
			oopsText.appendChild(oopsTextAnchor);
			if (l+1 < obsArray.length)	// Make the list comma-separated
				oopsText.appendChild(document.createTextNode(', '));
		}
	}
	return oopsText;
}
