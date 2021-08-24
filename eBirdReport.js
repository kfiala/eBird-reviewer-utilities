"use strict";
var mainTable = document.getElementById('contents');
if (mainTable) {
	var spreadSheet = [];
	var doHeaders = true;
	var headers = [];
	var rownum = 0;

	mainTable.querySelectorAll('tr').forEach(function(elTr) {
		var row = [];
		var subid, species, evidence, count, obsdate, user, locname, county, state, validity, status, dayOfYear;
		var checklist, chklstCell, chklstLink;
		const parser = new DOMParser();		

		elTr.querySelectorAll('td').forEach(function(Cell) {
			var Class = Cell.getAttribute('class').split(' ')[0];
			var html = parser.parseFromString(Cell.innerHTML,"text/html");
			var el = html.body.firstChild;

			if (doHeaders &&  (Class !== 'select') &&  (Class !== 'details')) {
				headers.push(Class);
				if (Class === 'obsdate') {
					headers.push('day of year');
				}
			}
			switch  (Class) {
				case "select":
				break;
				case "subID": {
					if (el.nodeName === 'A') {
						subid = el.innerHTML;
						checklist = 'https://ebird.org/checklist/' + subid
					}
				}
				break;
				case "species": {
					if (el.nodeName === 'LABEL') {
						species = el.innerHTML;
					}
				}
				break;
				case "evidence": if  (html) {
					if (el && el.nodeName === 'A') {
						var ev = parser.parseFromString(el.innerHTML,"text/html");
						evidence = ev.body.firstChild.innerHTML;                    
					}
				}
				break;
				case "count": count = Cell.innerHTML;
				break;
				case "obsdate": obsdate = Cell.innerHTML;
					var date = new Date(obsdate);
					var day = String(date.getDate()).padStart(2,'0');
					var month = String(date.getMonth()+1).padStart(2,'0');
					dayOfYear = month + ' ' + day;
				break;
				case "user": {
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
				case "details": break;
			}
		});
		if (rownum++) {
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
				spreadSheet.push(headers.join());
				doHeaders = false;
			}
			spreadSheet.push(row.join());

			chklstCell = document.createElement('td');
			chklstCell.setAttribute('class','KeBird');
			elTr.appendChild(chklstCell);
			
			chklstLink = document.createElement('a');
			chklstCell.appendChild(chklstLink);
			chklstLink.appendChild(document.createTextNode('ebird'));
			chklstLink.setAttribute('href',checklist);
			chklstLink.setAttribute('target','_blank');
		}
	});
	
	var downloadPara = document.getElementById('DownloadCSV');
	if (!document.body.contains(downloadPara)) {	// Create this paragraph only if not already done
		var downloadLi = document.createElement('p');
		downloadLi.setAttribute('id','DownloadCSV');
		document.getElementById("listnav").appendChild(downloadLi);

		// Create an anchor element
		var a = document.createElement('a');
		a.setAttribute("id",'dlAnchor');
		a.appendChild(document.createTextNode("Download csv"));
		a.setAttribute("download",'eBird report.csv');	// Set the csv name
		a.setAttribute("class","toggler");
		downloadLi.appendChild(a);
	}
	else {
		var a = document.getElementById('dlAnchor');
	}
	a.href=window.URL.createObjectURL(new Blob(['\ufeff',spreadSheet.join('\r\n')],{type:'text/csv'}));


	var nodeferPara = document.getElementById('nodefID');
	if (!document.body.contains(nodeferPara)) {	// Create this paragraph only if not already done
		var nodeferLi = document.createElement('p');
		nodeferLi.setAttribute('id','nodeferID');
		document.getElementById("listnav").appendChild(nodeferLi);

		// Create an anchor element
		var ae = document.createElement('a');
		ae.setAttribute("id",'nodeferAnchor');
		ae.appendChild(document.createTextNode("Toggle deferred"));
		ae.setAttribute("href","#");
		ae.onclick=function(){
			var deferred = document.getElementsByClassName('deferred');
			for (var i=0; i<deferred.length; i++) {
				if (deferred[i].parentNode.style.display == 'none') {
					deferred[i].parentNode.style.display = 'table-row'; 
				}
				else {deferred[i].parentNode.style.display = 'none';}
			}
		}
		ae.setAttribute("class","toggler");
		nodeferLi.appendChild(ae);
	}
}
