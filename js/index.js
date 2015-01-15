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

  var exists = (document.getElementsByClassName('js-airport-' + data.IATA).length > 0) ? true : false;
  
  if (exists || !data.IATA) return false;
  
  var div = document.createElement('div');
  div.className = 'panel js-airport js-airport-' + data.IATA;

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

  div.appendChild(name);
  div.appendChild(location);
  div.appendChild(status);
  div.appendChild(weather);
  
  document.getElementsByClassName('js-airports')[0].appendChild(div);
}

flights.removeTemplate = function(snapshot) {
  snapshot.forEach(function(child) {
    var data = child.val();
    var airport = document.getElementsByClassName('js-airport-' + data.IATA)[0];

    airport.parentNode.removeChild(airport);
  })
}

flights.updateData = function(snapshot) {
  snapshot.forEach(function(snapshot) {
    var data = snapshot.val();
    if (typeof data.IATA === 'undefined') return false;
    
    var airport = document.querySelector('.js-airport-' + data.IATA);
    
    if (data.delay) {
      if (airport.classList.contains('js-airport-delayed')) return false;
          
      airport.className += ' ' + 'js-airport-delayed'; 
    } else {
      airport.className = 'panel js-airport js-airport-' + data.IATA;
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

airportsRef.on('value', function(snapshot) {
  var data = snapshot.val();
  
  var lastUpdated = document.querySelector('.js-last-updated');
  lastUpdated.innerHTML = '<strong>Last Updated:</strong> ' + data._updated;
  
  flights.updateData(snapshot);
})

airportsRef.on('child_added', function(snapshot) {
  flights.createTemplate(snapshot);
})

airportsRef.on('child_removed', function(snapshot) {
  flights.removeTemplate(snapshot);
});

var select = document.querySelector('.js-search');

function bringToTop() {
  var selected = document.querySelector('.js-airport-' + this.value);
  var first = document.getElementsByClassName('js-airport')[0];
  
  first.parentNode.insertBefore(selected, first);
}

select.addEventListener('change', bringToTop);