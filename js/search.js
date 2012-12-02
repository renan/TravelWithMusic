Config.echonest = {
    apiKey: 'MXNBGHMQLSOTLCNWW'
};
Config.yahoo = {
    appId: 'CktiHV70',
    temperatureUnit: 'c'
};

var Search = function() {
    // Constructor
};

// Search by artists
Search.prototype.artists = function (options, callback) {
    var url = 'http://developer.echonest.com/api/v4/artist/search';

    var data = new Object;
    data.api_key    = Config.echonest.apiKey;
    data.results    = 50;
    data.start      = 0;

    if (options.mood) {
        data.mood = options.mood;
    }
    if (options.artist_location) {
        data.artist_location = options.artist_location;
    }

    $.ajax({
        url: url,
        dataType: 'json',
        data: data,
        success: function(data) {
            callback(data.response.artists);
        }
    });
};

// Search by songs
Search.prototype.songs = function (options, callback) {
    var url = 'http://developer.echonest.com/api/v4/song/search?bucket=tracks&bucket=id:spotify-WW';

    var data = new Object;
    data.api_key    = Config.echonest.apiKey;
    data.format     = 'json';
    data.results    = 3;
    data.start      = 0;
    //data.sort       = 'duration-asc';
    //data.limit      = true;

    if (options.results) {
        data.results= options.results;
    }
    if (options.description) {
        data.description= options.description;
    }
    if (options.artist_id) {
        data.artist_id = options.artist_id;
    }
    else if (options.mood) {
        data.mood = options.mood;
    }
    if (options.dance) {
        data.min_danceability = 0;
        data.max_danceability = 1;
    }

    $.ajax({
        url: url,
        dataType: 'json',
        data: data,
        success: function(data) {
            callback(data.response.songs);
        }
    });
};

// Search for songs based on the full config
Search.prototype.load = function(options, callback) {
    var results = [];
    var that = this;
    
    // search by themes
    if (options.themes.length) {
        for (var i in options.themes) {
            var theme = options.themes[i];
            this.songs({ description: theme }, function (data) {
                results = results.concat(data);
            });
        }
    }

    var moods           = [ 'happy', 'angry', 'sad', 'relaxing', 'excited' ];

    // search by location in the map
    if (options.locations) {
        // TODO Make work with multiple locations
        for (var i in options.locations) {
            var loc     = options.locations[i];
            this.artists({
                artist_location: loc.name,
                mood: loc.mood
            }, function (data) {
                var loop    = data.length;
                var k       = 1;
                for (var j in data) {
                    that.songs({
                        artist_id: data[j].id,
                        mood: loc.mood,
                        dance: loc.dance,
                        results: loc.frequency
                    }, function (data) {
                        results = results.concat(data);
                        if (k++ == loop) {
                            callback(results);
                        }
                    });
                }
            });
        }
    }
};

Search.prototype.locationByGeo = function(latitude, longitude, callback) {
    var geoAPI = 'http://where.yahooapis.com/geocode?location=' + latitude + ',' + longitude + '&flags=J&gflags=R&appid=' + Config.yahoo.appId;
    $.getJSON(geoAPI, function(response) {
        var result = false;
        if (response.ResultSet.Found == 1) {
            result = response.ResultSet.Results[0];
        }
        callback(result);
    });
};

Search.prototype.weatherByLocation = function(location, callback) {
    var wsql = 'select * from weather.forecast where woeid=' + location.woeid + ' and u="' + Config.yahoo.temperatureUnit  + '"',
        weatherYQL = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent(wsql) + '&format=json&callback=?';

    $.getJSON(weatherYQL, function(response) {
        var result = false;
        if (response.query && response.query.count == 1) {
            result = response.query.results.channel.item.condition;
        }
        callback(result);
    });
};

if (typeof require === 'undefined') {

var search = new Search();

search.locationByGeo(52.37, 4.89, function(location) {

    search.weatherByLocation(location, function(weather) {
        if (weather.text == 'Partly Cloudy') {
            mood = 'sad';
        }
        search.load({
            themes: [ ],
            locations: [
                {
                    name: location.country,
                    dance: 0,
                    frequency: 4,
                    mood: mood
                }
            ]
        }, function(data) {
            for (var i in data) {
                if (data[i].tracks.length && data[i].tracks[0].foreign_id) {
                    console.debug(data[i].tracks[0].foreign_id + ' ' + data[i].artist_name + ' - ' + data[i].title);
                }
            }
        });

    });
});

}
