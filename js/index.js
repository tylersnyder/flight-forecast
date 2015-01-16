try{Typekit.load();}catch(e){}

var request = new XMLHttpRequest();
request.open('GET', 'http://www.telize.com/geoip', true);

request.onload = function() {
  if (request.status >= 200 && request.status < 400) {
    var data = JSON.parse(request.responseText);
    data = JSON.stringify(data);
    var state = document.querySelector('.js-geodata');
    state.setAttribute('data', data);
    state.value = data;
  }
};

request.send();

var airportsRef = new Firebase('https://publicdata-airports.firebaseio.com/');

var flights = {}

function createDropdownOptions(data) {
  var search = document.getElementsByClassName('js-search')[0];

  var option = document.createElement('option');
  option.innerHTML = data.IATA + ': ' + data.name + ' (' + data.city + ', ' + data.state + ')';
  option.value = data.IATA;

  search.appendChild(option);
}

flights.createTemplate = function(snapshot) {
  var data = snapshot.val();

  if (!data.IATA || document.querySelectorAll('[data-airport=' + data.IATA + ']').length > 0) return false;

  var div = document.createElement('div');
  div.className = 'airport js-airport';
  div.setAttribute('data-airport', data.IATA);

  var icon = document.createElement('div');
  icon.className = 'icon icon-pin js-pin';

  var name = document.createElement('h3');
  name.className = 'js-airport-name';

  createDropdownOptions(data);

  var location = document.createElement('h5');
  location.className = 'js-airport-location';

  var status = document.createElement('div');
  status.className = 'js-airport-status fade';

  var weather = document.createElement('div');
  weather.className = 'js-airport-weather fade';

  function createChildSpan(target, data) {
    var span = document.createElement('span');
    span.className = 'js-airport-' + data.key();
    span.setAttribute('data-key', data.key());
    target.appendChild(span);
  }

  snapshot.child('status').forEach(function(data) {
    createChildSpan(status, data);
  })

  snapshot.child('weather').forEach(function(data) {
    createChildSpan(weather, data);
  })

  div.appendChild(icon);
  div.appendChild(name);
  div.appendChild(location);
  div.appendChild(status);
  div.appendChild(weather);

  document.querySelector('.js-airports').appendChild(div);
}

flights.removeTemplate = function(snapshot) {
  snapshot.forEach(function(child) {
    var data = child.val();
    var airport = document.querySelectorAll('[data-airport=' + data.IATA + ']');

    airport.parentNode.removeChild(airport);
  })
}

flights.updateData = function(snapshot) {
  snapshot.forEach(function(snapshot) {
    var data = snapshot.val();
    if (typeof data.IATA === 'undefined') return false;

    var airport = document.querySelectorAll('[data-airport=' + data.IATA + ']')[0];

    if (data.delay) {
      if (airport.classList.contains('js-airport-delayed')) return false;

      airport.className += ' ' + 'js-airport-delayed';
    } else {
      airport.className = 'airport js-airport';
    }

    var name = airport.querySelector('.js-airport-name');
    name.innerHTML = data.IATA + ': ' + data.name;

    var location = airport.querySelector('.js-airport-location');
    location.innerHTML = data.city + ', ' + data.state;

    function insertData(target, snapshot) {
      if (!snapshot.val() || snapshot.val() === '') return false;
      var span = target.querySelector('.js-airport-' + snapshot.key());
      span.innerHTML = snapshot.val();
    }

    snapshot.child('status').forEach(function(snapshot, index) {
      var status = airport.querySelector('.js-airport-status');
      insertData(status, snapshot);
    })
    snapshot.child('weather').forEach(function(snapshot, index) {
      var weather = airport.querySelector('.js-airport-weather');
      insertData(weather, snapshot);
    })
  })
}

flights.clickEvents = function() {
  function pinToPinboard(object) {
    (function hidePinNotification() {
      var p = document.querySelector('.js-pinboard p');
      p.className = 'hide';
    })();

    var pinboard = document.querySelector('.js-pinboard');
    var wrapper = document.createElement('div');

    wrapper.className = 'one-fourth-column';

    wrapper.appendChild(object);
    pinboard.appendChild(wrapper);
  }

  var search = document.querySelector('.js-search');

  search.addEventListener('change', function() {
    var selected = document.querySelectorAll('[data-airport=' + this.value + ']')[0];
    pinToPinboard(selected);
  });

  var pins = document.getElementsByClassName('js-pin');

  for(var i = 0; i < pins.length; i++) {
    pins[i].addEventListener('click', function() {
      pinToPinboard(this.parentNode);
    })
  }
}

airportsRef.on('value', function(snapshot) {
  var data = snapshot.val();

  var lastUpdated = document.querySelector('.js-last-updated');
  lastUpdated.innerHTML = '<strong>Last Updated:</strong> ' + data._updated;

  flights.updateData(snapshot);
})

airportsRef.on('child_added', function(snapshot) {
  flights.createTemplate(snapshot);
  flights.clickEvents();
})

airportsRef.on('child_removed', function(snapshot) {
  flights.removeTemplate(snapshot);
});
