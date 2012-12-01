require(['$api/models'], function(models) {
	var user = models.User.fromURI('spotify:user:renan.saddam')
		.load()
		.done(function(user) {
			var keys = [
				'currentUser',
				'identifier',
				'image',
				'name',
				'uri',
				'username'
			];
			var parsed = {};
			for (var i in keys) {
				var key = keys[i],
					value = user[key];

				parsed[key] = value;
			}
			console.log(user);
			console.log(parsed);
		}
	);
	console.debug(user);
});

require(['$api/models', '$views/image#Image'], function(models, Image) {
	var currentTrackDiv = $('<div />');
	$('body').append(currentTrackDiv);

	function updateCurrentTrack(){
		if (models.player.track == null) {
			currentTrackDiv.html('No track currently playing');
		} else {
			var artists = models.player.track.artists;
			var artists_array = [];
			for (i=0;i<artists.length;i++) {
				artists_array.push(artists[i].name);
			}

			var html = '<p>'
				+ '<img src="' + models.player.track.image + '" style="align:left;" />'
				+ 'Now playing: ' + artists_array.join(', ') + '<br />'
				+ ' - ' + models.player.track.name;
				+ '</p>';

			currentTrackDiv.html(html);
		}
	}

	// Keep track of current song
	models.player.load('track').done(updateCurrentTrack);

	// Update the DOM when the song changes
	models.player.addEventListener('change', updateCurrentTrack);

	// Playlist
	var promise = models.Playlist.createTemporary('Travel with Music Playlist');
	promise.done(function(playlist) {
		playlist._collections();
		playlist.tracks.add(models.Track.fromURI('spotify:track:0blzOIMnSXUKDsVSHpZtWL'));

		models.player.playContext(playlist);
	});

	// Play a single track
	var image = Image.forTrack(models.Track.fromURI('spotify:track:0blzOIMnSXUKDsVSHpZtWL'), {player:true});

	// Pass the player HTML code to the #single-track-player div
	var container = $('<div />');
	container.append(image.node);

	$('body').append(container);
});
