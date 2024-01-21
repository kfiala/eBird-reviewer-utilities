// On a filter window, add a green button to the end of each row, that displays bar chart graphs when clicked.
if (document.getElementById("region-name-codes"))
{
	let greenButton, sixcode, tr, td, species;
	let regionCodes = document.getElementById("region-codes").innerHTML;
	regionCodes = regionCodes.substring(0,regionCodes.length-1);
	let srh = document.getElementsByClassName('srh');
	let srv = document.getElementsByClassName('srv');
	for (let i=0; i<srv.length; i++) {
		species = srh[i].getElementsByClassName('snam')[0].textContent;
		sixcode = srv[i].getElementsByTagName('tr')[0].id;

		greenButton = document.createElement('button');
		greenButton.setAttribute("name",sixcode);
		greenButton.setAttribute("title",species + " bar chart");
		greenButton.style.height = "14px";
		greenButton.style.width = "22px";
		greenButton.style.backgroundColor = "green";
		greenButton.style.marginTop = "12px";

		tr = document.getElementById(sixcode);
		td = tr.insertCell(-1);
		td.setAttribute("width","22px");
		td.appendChild(greenButton);

		greenButton.addEventListener('mouseup', function (event) {
			// Has to be mouseup rather than click to prevent "enter" in the filter from having the same effect
			let thisYear = new Date().getFullYear();
			window.open("https://ebird.org/barchart?r="+regionCodes+"&bmo=1&emo=12&byr=1900&eyr=" + thisYear + "&spp="+event.target.name);
			event.preventDefault();
			return false;
		});
		// mouseup is always accompanied by click. Need a null click handler to prevent page reload caused by click.
		greenButton.addEventListener('click', (event) => { event.preventDefault() });
	}
}
