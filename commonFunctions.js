const MAXHIST = 10;

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

function createHistoryDiv() {
	let reviewHistory = fetchHistory();

	let recallDiv = document.getElementById('recallDiv');	// Clear the previous output
	if (recallDiv) recallDiv.remove;
	// Create a new one
	recallDiv = document.createElement('div');
	recallDiv.setAttribute('id', 'recallDiv');
	let recallList = document.createElement('ol');
	let recallP = document.createElement('p');
	recallDiv.style.display = 'none';
	recallDiv.style.marginLeft = '2em';
	recallP.style.fontSize = '13px';
	recallP.textContent = 'Previously changed records: ';
	recallDiv.append(recallP);
	recallDiv.append(recallList);

	let obsArray;
	if (reviewHistory.length > 0) {
		recallP.textContent = 'Previously changed records: ';
		for (let o = reviewHistory.length - 1, j = 0; o >= 0; o--, j++) {
			let listItem = document.createElement('li');
			obsArray = reviewHistory[o].split(",");

			let obsAnchor, pieces, obsID, taxon = '';
			for (let obs = 0; obs < obsArray.length; obs++) {
				// Set up the hyperlink for this observation
				pieces = obsArray[obs].split('/');
				obsID = pieces[0];
				if (pieces.length > 1) {
					taxon = obsArray[obs].substring(obsID.length + 1);	// Might be a slash in the name, can't use split
				} else {
					taxon = '';
				}

				obsAnchor = document.createElement('a');
				if (taxon) {
					obsAnchor.appendChild(document.createTextNode(taxon));
				} else {
					obsAnchor.appendChild(document.createTextNode(obsArray[obs]));
				}
				obsAnchor.setAttribute('target', '_blank');
				obsAnchor.setAttribute('href', 'https://review.ebird.org/admin/qr.htm?obsId=' + obsID);

				listItem.appendChild(obsAnchor);
				if (obs + 1 < obsArray.length)	// Make the list comma-separated
					listItem.appendChild(document.createTextNode(', '));
			}
			recallList.append(listItem);
		}
	} else {
		recallP.textContent = 'No previously changed records';
	}
	return recallDiv;
}

function fetchHistory() {
	let reviewHistory = localStorage.getItem('history');
	if (reviewHistory) {
		reviewHistory = JSON.parse(reviewHistory);
	} else {
		reviewHistory = [];
	}
	/* Backward compatibility--move lastChange into history, remove lastChange */
	let lastChange = localStorage.getItem('lastChange');
	if (lastChange) {
		reviewHistory.push(lastChange);
		if (reviewHistory.length > MAXHIST) {
			reviewHistory.shift();
		}
		localStorage.setItem('history', JSON.stringify(reviewHistory));
		localStorage.removeItem('lastChange');
	}

	return (reviewHistory);
}

function storeRecallHistory(changes) {
	let reviewHistory = fetchHistory();
	reviewHistory.push(changes);
	if (reviewHistory.length > MAXHIST) {
		reviewHistory.shift();
	}
	localStorage.setItem('history', JSON.stringify(reviewHistory));
}