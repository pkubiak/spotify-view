const CLIENT_ID = '2788ef9b99b94f508d797cf63afdc445';
const REDIRECT_URL = document.location.href.split('#')[0];
// const REDIRECT_URL = window.location.href.indexOf('localhost') == -1 ? 'https:%2F%2Fpkubiak.github.io%2Fspotify%2Findex.html' : 'http:%2F%2Flocalhost%2Findex.html';
const POLL_INTERVAL = 5000;
let TOKEN = null;

const STYLES = 4;

let STYLE = 0;
var last= null, views=[];

function nextStyle() {
    STYLE = (STYLE+1) % STYLES;
    last = null;
    readState();
}

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
    let background = null;

    if(STYLE == 0)
        background = data.cover;
    else if(STYLE == 1)
        background = randomGradient({colorRange: 30, saturation: 30});
    else if(STYLE == 2)
        background = randomGradient({saturation: 50});
    else if(STYLE == 3)
        background = randomGradient({saturation: 70});

    backdrop.style.backgroundImage = 'url('+background+')';
    title.innerText = data.title;
    artist.innerText = data.artists.join(', ');
    document.title = '▶ ' + data.title + ' - ' + data.artists.join(', ');
    document.querySelector('a.fa-link').href = data.url;

    main.appendChild(img);
    main.appendChild(title);
    main.appendChild(artist);
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
    .then(response => response.status == 204 ? null : response.json())
    .then(data => {
        if(!data)
            return false;
        let artists = [];
        for(let artist of data.item.artists)
            artists.push(artist.name);
        console.log(data);
        return {
            id: data.item.id,
            title: data.item.name,
            artists: artists,
            cover: data.item.album.images[0].url,
            url: data.item.external_urls.spotify
        };
    });
}

async function readState() {
    let current = await getCurrentlyPlaying(TOKEN);
    console.log(current);
    if(current)
        updateView(current);
}

function oninit(){
    document.querySelector('a.fa-spotify').href = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${REDIRECT_URL}&scope=user-read-currently-playing`;
    TOKEN = getToken();
    if(TOKEN) {
        document.querySelector('a.fa-spotify').onclick = function(){return false};
        readState();
        setInterval(readState, POLL_INTERVAL);
    }

    // console.log(navigator.userAgent);
    // fetch('http://192.168.1.5:8000/'+navigator.userAgent+'/'+window.screen.width+'_'+window.screen.height);
}

function randomGradient(config) {
    let canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    let ctx = canvas.getContext('2d');
    let baseColor = config.baseColor || 360*Math.random();
    let colorRange = config.colorRange || 100*Math.random();
    let saturation = config.saturation || (60*Math.random() + 20);
    let radius = config.radius || 32;

    for(let i=0;i<100;i++) {
        ctx.beginPath();
        let color = (baseColor + colorRange*Math.random()) % 360;
        let lightness = 40 + 30*Math.random();
        ctx.fillStyle = 'hsl('+color+', '+saturation+'%, '+lightness+'%)';
        ctx.arc(512*Math.random(), 512*Math.random(), radius*(1+Math.random()), 0, 10);
        ctx.fill();
        if(i == 0)
            ctx.fillRect(0, 0, 512, 512);
    }

    return canvas.toDataURL();
}