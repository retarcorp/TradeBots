let addbtn = document.getElementsByClassName('bots__button-add')[0];

addbtn.addEventListener('click', (e) => {
	e.preventDefault();
	let xhr = new XMLHttpRequest();
	xhr.open('POST', '/bots-add', true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	let body = 'Title=' + Date.now() + '&Pair=BTCETH';
	xhr.send(body);
});

// if(key.value && secret.value && name.value){
// 	API.name = name.value;
// 	API.key = key.value;
// 	API.secret = secret.value;
// 	let xhr = new XMLHttpRequest();
// 	let mas = [];
// 	for(keys in API) {
// 		mas.push(`${keys}=${API[keys]}`);
// 	}
// 	let body = mas.join('&');
// 	xhr.open('POST', '/account/api', true);
// 	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
// 	xhr.send(body);
// }
// name.value = '';
// key.value = '';
// secret.value = '';