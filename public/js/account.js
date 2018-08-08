let API = {
	name: null,
	key: null,
	secret: null
};

let saveBtn = document.getElementsByClassName('button__save-binance')[0];
let deleteBtn = document.getElementsByClassName('button__cancel-binance')[0];

let name = document.getElementById('name');
let key = document.getElementById('apiKey');
let secret = document.getElementById('apiSecret');

saveBtn.addEventListener('click', (e) => {
	e.preventDefault();
	if(key.value && secret.value && name.value){
		API.name = name.value;
		API.key = key.value;
		API.secret = secret.value;
		let xhr = new XMLHttpRequest();
		let mas = [];
		for(keys in API) {
			mas.push(`${keys}=${API[keys]}`);
		}
		let body = mas.join('&');
		xhr.open('POST', '/account/api', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.send(body);
	}
	name.value = '';
	key.value = '';
	secret.value = '';
});

deleteBtn.addEventListener('click', (e) => {
	e.preventDefault();
	let xhr = new XMLHttpRequest();
	xhr.open('DELETE', '/account/api', true);
	// xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.send(200);
});