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
		greenButton.style.backgroundColor = "green";
		greenButton.style.marginTop = "12px";

		tr = document.getElementById(sixcode);
		td = tr.insertCell(-1);
		td.setAttribute("width","12px");
		td.appendChild(greenButton);

		greenButton.addEventListener('click', function (event) {
			let thisYear = new Date().getFullYear();
			window.open("https://ebird.org/barchart?r="+regionCodes+"&bmo=1&emo=12&byr=1900&eyr=" + thisYear + "&spp="+event.target.name);
			event.preventDefault();
			return false;
		});
	}
}
