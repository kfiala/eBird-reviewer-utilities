var OBS, TAXON, mainButton;

if (window.location.href.includes('https://review.ebird.org/admin/qr.htm')) {
	wait();
}

function wait() {	// Wait until qr-obs-documentation is in the DOM, then do setup of kdiv.
	if (document.getElementById('kdiv')) return;	// Beware of possible double entry
	if (!document.getElementById('qr-obs-documentation')) {
		setTimeout(wait,100);
	} else {
		document.body.addEventListener('mouseenter', () => {
			if (!document.getElementById('kdiv')) {
				wait();
			}
		});
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
		}		
	}
	let qrTitle = document.getElementById('qr-obs-title');
	TAXON = qrTitle.querySelector('span.Heading-main').textContent;
	
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
	const month = parseInt(ISOdate.split('-')[1]);
	let Bmonth = (month > 1) ? month - 1 : 12;
	let Emonth = (month < 12) ? month + 1 : 1;
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
		'&bmo=' + Bmonth +
		'&emo=' + Emonth +
		'&zh=true&gp=true';
//	Create the anchor for the map
	const map = document.createElement('a');
	map.appendChild(document.createTextNode(' eBird species map for season'));

	map.setAttribute('href',URL);
	map.setAttribute('target','_blank');

	document.getElementById('kdiv').appendChild(map);	// Append the map hyperlink to kdiv
	kdiv.appendChild(document.createTextNode(' | '));
	
// 	Last thing in the div is an empty span, just a placeholder for now
	let infoCell = document.createElement('span');
	infoCell.setAttribute('id','kInfo');

	document.getElementById('kdiv').appendChild(infoCell);	// Append the span to kdiv
	document.getElementById('kdiv').appendChild(createRecallText());

// Setup for checklist comments
// Create empty html elements that will be filled in later
	let commentsP = document.createElement('p');
	commentsP.style.fontSize = '13px';
	commentsP.style.color = '#0070b3';
	commentsP.style.display = 'none';
	commentsP.setAttribute('id', 'commentsP');
	let commentSpan0 = document.createElement('span');
	let commentSpan1 = document.createElement('span');
	let commentSpan2 = document.createElement('span');
	let commentSpan3 = document.createElement('span');
	let commentSpan4 = document.createElement('span');
	commentSpan0.style.display = 'none';
	commentSpan1.style.display = 'inline-block';
	commentSpan2.style.display = 'none';
	commentSpan2.style.textDecoration = 'underline';
	commentSpan3.style.display = 'none';
	commentSpan4.style.display = 'none';
	commentSpan4.style.textDecoration = 'underline';
	commentSpan0.setAttribute('id', 'commentSpan0');
	commentSpan1.setAttribute('id','commentSpan1');
	commentSpan2.setAttribute('id','commentSpan2');
	commentSpan3.setAttribute('id','commentSpan3');
	commentSpan4.setAttribute('id', 'commentSpan4');
	commentsP.appendChild(commentSpan0);
	commentsP.appendChild(commentSpan1);
	commentsP.appendChild(commentSpan2);
	commentsP.appendChild(commentSpan3);
	commentsP.appendChild(commentSpan4);
	commentSpan0.appendChild(document.createTextNode('Checklist comments: '));
	commentSpan2.addEventListener('click', () => {
		commentSpan1.style.display = 'none'; commentSpan2.style.display = 'none';
		commentSpan3.style.display = 'inline-block'; commentSpan4.style.display = 'block';
	});
	commentSpan4.addEventListener('click', () => {
		commentSpan1.style.display = 'inline-block'; commentSpan2.style.display = 'block';
		commentSpan3.style.display = 'none'; commentSpan4.style.display = 'none';
	});
	document.getElementById('kdiv').appendChild(commentsP);
	// End of setup for checklist comments
	if (OBS) {	// Start asynchronous call for observation data
		obsViewData(OBS);
	}
}

function secondWait(e) { //	After a top-level button is clicked, wait for the "Review reason and notes" panel to be ready.
	if (e) {
		mainButton = e.target.textContent;	// Which top-level button; we'll want this in the next function.
	}
	if (!document.getElementById('reasonPage')) {
		setTimeout(secondWait,100);
	} else {
		setTimeout(reviewReasonAndNotesSetup, 50);
	}
}

function reviewReasonAndNotesSetup() {
	let reasonPage = document.getElementById('reasonPage');
	reasonPage.style.top = 'calc(100% - 175px)';
	const targetLabels = ['Next', 'Accept', 'Unconfirm', 'Defer'];
	let buttons = reasonPage.querySelectorAll('button');
	let label;
	for (let b = 0; b < buttons.length; b++) {
		label = buttons[b].textContent;
		if (targetLabels.includes(label)) {
			if (['Next', 'Accept'].includes(label)) {
				if (document.getElementById('send-email-checkbox').checked) {
					buttons[b].addEventListener('click', emailWait);	// need to wait for more DOM for emailing
				} else {
					buttons[b].addEventListener('click', storeChange);
				}
			} else {	// Unconfirm, Defer
				buttons[b].addEventListener('click', storeChange);
			}
		}
	}

	// Set up Send email checkbox.
	document.getElementById('send-email-checkbox').addEventListener('change', () => {
		setTimeout(emailToggle, 200);
	});

	// When top-level Unconfirm is clicked for a record with no media,
	// "Reason" is not initially set, "Send email" is unchecked, and the right button is pre-set to Unconfirm thus no emailWait.
	// When Reason is set, Send email is automatically checked and the right button gets set to Next but without emailWait
	// because emailToggle does not get called.  So we set up emailToggle to run when the reason code is set.
	document.getElementById('review-reason').addEventListener('change', () => { setTimeout(emailToggle, 200) });
}

function emailToggle() {	// Swap event listeners when Send email is toggled
	let reasonPage = document.getElementById('reasonPage');
	const targetLabels = ['Next', 'Accept', 'Unconfirm', 'Defer'];
	let buttons = reasonPage.querySelectorAll('button');
	for (let b = 0; b < buttons.length; b++) {
		let label = buttons[b].textContent;
		if (targetLabels.includes(label)) {
			if (mainButton === 'Defer') {	// fix a bug in CLO code which unconditionally leaves the button labeled Next
				label = document.getElementById('send-email-checkbox').checked ? 'Next' : 'Defer';
				buttons[b].textContent = label;
			}
			if (label === 'Next') {
				buttons[b].addEventListener('click', emailWait);	// mailing so need to wait for more email DOM
				buttons[b].removeEventListener('click', storeChange);	// button may have previously had one of the other labels
				break;
			} else {
				buttons[b].addEventListener('click', storeChange);
				buttons[b].removeEventListener('click', emailWait);	// button may have previously had one of the other labels
			}
		}
	}
}

function storeChange() {
	localStorage.setItem('lastChange', OBS + '/' + TAXON);
}

function emailWait() {
	if (!document.getElementById('email-message1') || !document.getElementById('email-message1').textContent) {
		setTimeout(emailWait,100);
	} else {
		setTimeout(mailSetup,100);	// Wait for CLO code to finish
	}
}

function mailSetup() {
	const targetLabels = ['Send email'];
	let buttons = document.querySelectorAll('button');
	for (let b=0; b<buttons.length; b++) {
		let label = buttons[b].textContent;
		if (targetLabels.includes(label)) {
			buttons[b].addEventListener('click', storeChange);
			break;
		}
	}
	// Update the email content to convert the checklist URL to a clickable hyperlink
	let message = document.getElementById('email-message1').textContent;
	let URLindex = message.indexOf('\nhttps');
	if (URLindex) {
		let URL = message.substring(URLindex+1);
		let URLlen = URL.indexOf("\n");
		URL = URL.substring(0, URLlen);
		let newMessage = message.replace(URL, '<a href="' + URL + '">' + URL + '</a>');

		// Reword this message, which is only in the "misidentified" email:
		newMessage = newMessage.replace('The documentation you have provided shows a', 'The photos you have provided show');
		document.getElementById('email-message1').textContent = newMessage;
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
	// It toggles the display status of previously updated records..
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

async function obsViewData(OBS) {
	let url = 'https://review.ebird.org/admin/api/v1/obs/view/' + OBS;
	let response = await fetch(url);
	let json = await response.json();
// Store the checklist comments into the previously created but empty html elements
	const maxCommentLength = 400;
	let listComments = json.sub.comments;
	if (listComments) {
		let shortComments = listComments;
		if (shortComments.length > maxCommentLength) {
			let breakpoint = listComments.lastIndexOf(' ', maxCommentLength);
			breakpoint = (breakpoint > 0) ? breakpoint : listComments.length;
			shortComments = listComments.slice(0, breakpoint);
			document.getElementById('commentSpan2').style.display = 'block'; // "[More]"
		}

		document.getElementById('commentsP').style.display = 'block';
		document.getElementById('commentSpan0').style.display = 'inline-block';
		document.getElementById('commentSpan0').style.marginRight = '0.2em';
		document.getElementById('commentSpan1').appendChild(document.createTextNode(shortComments));
		document.getElementById('commentSpan2').appendChild(document.createTextNode(' [More]'));
		document.getElementById('commentSpan3').appendChild(document.createTextNode(listComments));
		document.getElementById('commentSpan4').appendChild(document.createTextNode(' [Less]'));
	}
// End of checklist comment setup

	let span = document.getElementById('kInfo');
	let method, version;

	if (json.loc.isHotspot) {
		let locType = ' Location is hotspot';
		let hotLink = document.createElement('a');
		span.appendChild(hotLink);
		hotLink.appendChild(document.createTextNode(locType));
		let hotUrl = 'https://ebird.org/hotspot/' + json.sub.locId;
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
		if (json.sub.submissionMethodVersionDisp) {
			version = json.sub.submissionMethodVersionDisp;
		} else {
			version = '';
		}
	} else {
		method = 'unknown method';
		version = '';
	}
	span.appendChild(document.createTextNode( 'Submitted via ' + method + ' ' + version + ' | '));
	return;
}
