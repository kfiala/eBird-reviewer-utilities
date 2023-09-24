// Export an eBird review filter in csv format
let mainTable=document.getElementById('filter-grid-species');
if(mainTable)	// The filter is <ul id="filter-grid-species" 
{
	let nameLookup=[];
	mainTable.querySelectorAll('label').forEach(function(elLabel)	// List all the species in a lookup table
	{	// Each <li> contains a <label 
		let alpha6=elLabel.getAttribute('for').substring(3);	// The <label's 'for' attribute contains the alpha6 code for the species
		nameLookup[alpha6]=elLabel.querySelector('div').textContent;	// The label contains a <div whose innerHTML is the species name
	});
	// Each <li contains a <table that contains the cutoff dates and count limits
	let spreadSheet=[];
	mainTable.querySelectorAll('tr').forEach(function(elTr)	// For each filter row
	{
		let row=[];
		row.push('"'+nameLookup[elTr.getAttribute('id')]+'"');	// Push the species name
		// Each <td contains a <div class="tc"> for each filter entry
		let tableCell=elTr.querySelectorAll('.tc');	// 
		tableCell.forEach(function(elTc)
		{
			let tcdate,tcvalue;
			let spanElement = elTc.getElementsByTagName('span');
			tcdate = spanElement[0].innerHTML;	// The <div contains a <span whose innerHTML is the date for the cell
			if (spanElement.length > 1) {		// read-only filters have two <spans
				tcvalue=spanElement[1].innerHTML;	// The second <span's innerHTML is the cutoff count value
			}
			else {	// editable filters have only one <span. 
				let inputElement = elTc.getElementsByTagName('input')[0];
				tcvalue = inputElement.getAttribute('value');	// The <input element's 'value" is the cutoff count value
			}
			row.push(tcdate);
			row.push(tcvalue);
		});
		spreadSheet.push(row.join());
	});
	// Create a new list item at the end of the h-bar list
	let downloadLi=document.createElement('li');
	downloadLi.setAttribute('id','download');
	document.getElementsByClassName('h-bar')[0].appendChild(downloadLi);

	// Create an anchor element
	let a = document.createElement('a');
	a.appendChild(document.createTextNode("Download csv"));
	a.setAttribute("download",document.getElementById('cl_name').innerHTML+".csv");	// Set the checklist name for the csv name
	a.href=window.URL.createObjectURL(new Blob(['\ufeff',spreadSheet.join('\r\n')],{type:'text/csv'}));
	downloadLi.appendChild(a);	// Put the anchor element in the list item
}
