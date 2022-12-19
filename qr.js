var OBS, TAXON, mainButton;

mainline();

function mainline () {
	if (window.location.href.includes('https://review.ebird.org/admin/qr.htm')) {
		document.body.addEventListener('mouseenter', () => {	// We can't do anything until DOM is complete; have to wait for it
			if (!document.getElementById('kdiv')) {				// Need a signal when to start
				wait();
			}
		});
	}
}

function wait() {	// Wait until qr-obs-documentation is in the DOM, then do setup of kdiv.
	if (document.getElementById('kdiv')) return;	// Beware of possible double entry
	if (!document.getElementById('qr-obs-documentation')) {
		setTimeout(wait,100);
	} else {
		delayedSetup();
	}
}

function delayedSetup() {	// Finish initial setup now that DOM is ready
	const targetLabels = ['Unconfirm', 'Defer', 'Accept'];	// We only care about these three buttons.
	let buttons = document.querySelectorAll('button');
	for (let b=0; b<buttons.length; b++) {	// Set up click listeners on the buttons
		let label = buttons[b].textContent;
		if (targetLabels.includes(label)) {
			buttons[b].addEventListener('click', secondWait);	// When a button is clicked, wait for more DOM that we will need
		}
	}

//	Create our private div and insert it.
	let kdiv = document.createElement('div');
	kdiv.setAttribute('id','kdiv');
	kdiv.style.marginLeft = '1em';
	let hostdiv = document.getElementById('qr-obs-documentation');
	hostdiv.insertBefore(kdiv,hostdiv.firstChild);

//	Set up the recall link
	createOopsControl();
//	Collect information for other links
	let obsDetails = document.getElementById('qr-obs-details');
	let urls = obsDetails.querySelectorAll('a');
	let subId, GPS, sixcode, ISOdate;
	for (let u=0; u<urls.length; u++) {
		let url = urls[u].toString();
		if (url.includes('subID=')) {					// https://review.ebird.org/admin/reviewSub.htm?subID=S123096362
			subId = url.split('=')[1];
			ISOdate = urls[u].textContent.split(' ')[0];	// 2022-11-27 16:29
		} else if (url.includes('maps.google.com')) {	// http://maps.google.com/?q=35.7703241,-78.8218188
			GPS = url.split('=')[1];
		} else if (url.includes('viewFilter.htm')) {	// https://review.ebird.org/admin/viewFilter.htm?spp=rufhum&checklistID=CL22986&src=OBS1570434379
			sixcode = url.split('=')[1];
			sixcode = sixcode.split('&')[0];
		} else if (url.includes('obsID=')) {			// https://review.ebird.org/admin/reviewObs.htm?obsID=OBS1570434379
			OBS = url.split('=')[1];
			obsViewData(OBS);
		}		
	}
	let qrTitle = document.getElementById('qr-obs-title');
	urls = qrTitle.querySelectorAll('a');
	for (let ur=0; ur<urls.length; ur++) {
		let url = urls[ur].toString();
		if (url.includes('/species/' )) {
			TAXON = urls[ur].textContent;
		}
	}

	// Create a new span ("cell") for the eBird checklist hyperlink
	let chklstCell = document.createElement('span');
	chklstCell.setAttribute('style','color:#ccc');
	document.getElementById('kdiv').appendChild(chklstCell);	// Append the span to kdiv

	let chklstLink = document.createElement('a');
	chklstCell.appendChild(chklstLink);
	chklstLink.appendChild(document.createTextNode(' eBird checklist'));
	let checklist = 'https://ebird.org/checklist/' + subId
	chklstLink.setAttribute('href',checklist);
	chklstLink.setAttribute('target','_blank');
	chklstCell.appendChild(document.createTextNode(' | '));

//	Get the numeric month of the observation date
	const month = ISOdate.split('-')[1];
//	Get coordinates
	const coords = GPS.split(',');
	const Y = parseFloat(coords[0]);
	const X = parseFloat(coords[1]);
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
	map.appendChild(document.createTextNode(' eBird species map for month'));

	map.setAttribute('href',URL);
	map.setAttribute('target','_blank');

	document.getElementById('kdiv').appendChild(map);	// Append the map hyperlink to kdiv
	kdiv.appendChild(document.createTextNode(' | '));
	
// 	Last thing in the div is an empty span, just a placeholder for now
	let infoCell = document.createElement('span');
	infoCell.setAttribute('id','kInfo');

	document.getElementById('kdiv').appendChild(infoCell);	// Append the span to kdiv
	document.getElementById('kdiv').appendChild(createRecallText());
}

function secondWait(e) { //	After a top-level button is clicked, wait for the "Review reason and notes" panel to be ready.
	if (e) {
		mainButton = e.target.textContent;	// Which top-level button; we'll want this in the next function.
	}
	if (!document.getElementById('reasonPage')) {
		setTimeout(secondWait,100);
	} else {
		reviewReasonAndNotesSetup(false);
	}
}

function reviewReasonAndNotesSetup(recursing) {
	let reasonPage = document.getElementById('reasonPage');
	const targetLabels = ['Next', 'Accept', 'Unconfirm', 'Defer'];
	let buttons = reasonPage.querySelectorAll('button');
	let checkBox = document.getElementById('send-email-checkbox');
	for (let b=0; b<buttons.length; b++) {
		let label = buttons[b].textContent;
		if (targetLabels.includes(label)) {
			buttons[b].removeEventListener('click', secondWait);
			if (mainButton === 'Defer') {	// fix a bug in CLO code
				if (!checkBox.checked) {
					buttons[b].textContent = 'Defer';
					label = 'Defer!';
				} else {
					buttons[b].textContent = 'Next';
				}
			}
			if (label==='Next') {
				buttons[b].addEventListener('click', emailWait);	// If mailing, need to wait for more DOM
				break;
			} else {
				buttons[b].addEventListener('click', () => {
					localStorage.setItem('lastChange',OBS + '/' + TAXON);
				});
			}
		}
	}
	if (!recursing) {
		checkBox.addEventListener('change',() => {
			if (document.getElementById('send-email-checkbox').checked) {
				reviewReasonAndNotesSetup(true);
			} else {
				reviewReasonAndNotesSetup(true);
			}
		});
	}
}

function emailWait() {
	if (!document.getElementById('email-message2')) {
		setTimeout(emailWait,100);
	} else {
		mailSetup();
	}
}

function mailSetup() {
	const targetLabels = ['Send email'];
	let buttons = document.querySelectorAll('button');
	for (let b=0; b<buttons.length; b++) {
		let label = buttons[b].textContent;
		if (targetLabels.includes(label)) {
			buttons[b].addEventListener('click', () => {
				localStorage.setItem('lastChange',OBS + '/' + TAXON);
			});
			break;
		}
	}
}

function createOopsControl() {
	// Create a span to contain the hyperlink and add it to kdiv
	// We are going to build <span id=oopsControl><a id=oopsAnchor href=# class=toggler>Recall</a></span>
	let oopsControlP = document.createElement('span');		// Span to contain the toggle hyperlink
	oopsControlP.setAttribute('id','oopsControl');
	let kdiv = document.getElementById('kdiv');
	kdiv.appendChild(oopsControlP);

	// Create an anchor element
	let oopsAnchor = document.createElement('a');	// This is the actual toggle hyperlink

	oopsAnchor.appendChild(document.createTextNode(" Recall"));
	oopsAnchor.setAttribute("href","#");
	oopsAnchor.setAttribute("class","toggler");
	oopsControlP.appendChild(oopsAnchor);	// Put the hyperlink in its paragraph
	kdiv.appendChild(document.createTextNode(' | '));

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
	for (var obs=0; obs<obsArray.length; obs++) {
		if (obsArray[0] === 'None') {
			oopsText.appendChild(document.createTextNode('None'));
			break;
		} else {	// Set up the hyperlink for this observation
			pieces = obsArray[obs].split('/');
			obsID = pieces[0];
			if (pieces.length > 1) {
				taxon = pieces[1];
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

async function obsViewData(OBS) {
	let url = 'https://review.ebird.org/admin/api/v1/obs/view/' + OBS;
	try {
		let response = await fetch(url);
		let json = await response.json();
		let locId = json.sub.locId;

		let span = document.getElementById('kInfo');
		let method, version;

		if (json.loc.isHotspot) {
			let locType = ' Location is hotspot';
			let hotLink = document.createElement('a');
			span.appendChild(hotLink);
			hotLink.appendChild(document.createTextNode(locType));
			let hotUrl = 'https://ebird.org/hotspot/' + locId;
			hotLink.setAttribute('href',hotUrl);
			hotLink.setAttribute('target','_blank');
			span.appendChild(document.createTextNode(' | '));
		} else {
			span.appendChild(document.createTextNode(' Location is personal | '));
		}

		if (typeof json.sub.submissionMethodCode !== 'undefined') {	// Possibilities: EBIRD_web, EBIRD_upload, EBIRD_iOS, EBIRD_Android, or none
			method = json.sub.submissionMethodCode;
			if (method.substr(0,6) === 'EBIRD_')
				method = method.substr(6);
			if (json.sub.submissionMethodVersionDisp !== 'undefined') {
				version = json.sub.submissionMethodVersionDisp;
			} else {
				version = '';
			}
		} else {
			method = 'unknown method';
			version = '';
		}
		span.appendChild(document.createTextNode( 'Submitted via ' + method + ' ' + version + ' | '));
		return(json.sub.submissionMethodCode);
	} catch (error) {
		alert(error);
	}
}
