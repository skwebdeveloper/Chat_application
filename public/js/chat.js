const socket = io();
// Taking this from chat.js via MESSAGE Id of FORM
const mainform = document.querySelector('#message');
const inputform = mainform.querySelector('input');
const formbutton = mainform.querySelector('#increment');
const locationbutton = mainform.querySelector('#send-location');
const messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationtemplate = document.querySelector('#locationtemplate').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// QS
// ignoreQueryPrefix is used to remove ? 
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    // lastElementChild is for last message 
    const newmessage = messages.lastElementChild
    //  Heigth of new messages 
    const newmessageStyle = getComputedStyle(newmessage);
    const newmessageMargin = parseInt(newmessageStyle.marginBottom);
    const newmessageHeight = newmessage.offsetHeight + newmessageMargin

    const visibleHeight = messages.offsetHeight;

    const containerHeight = messages.scrollHeight;

    const scrollOffSet = messages.scrollTop + visibleHeight;

    if (containerHeight - newmessageHeight <= scrollOffSet) {
        messages.scrollTop = messages.scrollHeight
    }
}

// Normal message 
socket.on('message', (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm:ss a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// This is for Location message 
socket.on('locationmessage', (message) => {
    console.log(message);
    const html = Mustache.render(locationtemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm:ss a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

// This is for room data 
socket.on('roomdata', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    // sidebar
    document.querySelector('#mySidenav').innerHTML = html
})


mainform.addEventListener('submit', (e) => {
    // This is used to prevent refresh
    e.preventDefault();
    formbutton.setAttribute('disabled', 'disabled');
    const mess = document.querySelector('input').value;
    socket.emit('sendmessage', mess, (message) => {
        // This is for input, so that everytime we refresh we got blank input
        formbutton.removeAttribute('disabled');
        inputform.value = '';
        inputform.focus();
        console.log('The message was delivered', message);
    });
});


// This is for sharing location
locationbutton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert("Geolocation not supported on your browser");
    }
    // Once you click it become disabled so that request is working 
    locationbutton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {
            console.log('Location shared');
            // Now when it appers on your screen now it become abled 
            locationbutton.removeAttribute('disabled');
        });
    });
});


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        // If your username is already in use so I can redirect you to main page 
        location.href = '/'
    }
});