const CLIENT_ID = '2788ef9b99b94f508d797cf63afdc445';
const REDIRECT_URL = window.location.href.indexOf('localhost') == -1 ? 'https:%2F%2Fpkubiak.github.io%2Fspotify%2Findex.html' : 'http:%2F%2Flocalhost%2Findex.html';
const POLL_INTERVAL = 5000;

var last= null, views=[];

function getToken() {
    let params = window.location.hash.substr(1).split('&');
    for(let param of params) {
        let [key, value] = param.split('=');
        if(key == 'access_token')
            return value;
    }
    return null;
}

function popView() {
    if(views.length > 1) {
        let view = views.shift();
        document.body.removeChild(view);
    }
}

function updateView(data) {
    if(last == data.id)
        return;
    last = data.id;

    let main = document.createElement('main');
    let backdrop = document.createElement('div');
    let img = document.createElement('img');
    let title = document.createElement('h1');
    let artist = document.createElement('h2');
    backdrop.classList.add('backdrop');
    img.src = data.cover;
    main.style.backgroundImage = 'url('+data.cover+')';
    title.innerText = data.title;
    artist.innerText = data.artists.join(', ');
    document.title = '▶ ' + data.title + ' - ' + data.artists.join(', ');

    backdrop.appendChild(img);
    backdrop.appendChild(title);
    backdrop.appendChild(artist);
    main.appendChild(backdrop);
    document.body.appendChild(main);
    views.push(main);
    setTimeout(popView, 5000);
}

async function getCurrentlyPlaying(token) {
    return fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        let artists = [];
        for(let artist of data.item.artists)
            artists.push(artist.name);

        return {
            id: data.item.id,
            title: data.item.name,
            artists: artists,
            cover: data.item.album.images[0].url
        };
        // if(!data.item.id)
        //     return null;
        // fetch(`https://api.spotify.com/v1/tracks/${data.item.id}`, {
        //     headers: {
        //         'Authorization': `Bearer ${token}`
        //     }
        // }).then(response => response.json())
        // .then(data2 => {
        //     console.log('>>>', data, data2);
        // });
        // updateView(data)
    });
}

async function readState(token) {
    let current = await getCurrentlyPlaying(token);
//     {artists: ["Faster"],
// cover: "https://i.scdn.co/image/ab67616d0000b2733fe3e8a32fb622cc86896eb7",
// id: "18VZZixjjaxDb15otiMmVV",
// title: "Audi W LPG"};//
    console.log(current);
    updateView(current);
}

function oninit(){
    document.querySelector('a').href = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URL}&scope=user-read-currently-playing`;
    let token = getToken();

    if(token) {
        readState(token);
        setInterval(function(){readState(token);}, POLL_INTERVAL);
    }
}