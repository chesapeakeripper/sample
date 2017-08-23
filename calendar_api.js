var googleAuth = require('google-auth-library');
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart.json';

var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

module.exports = {

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json

// Load client secrets from a local file.
/*fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Calendar API.
  authorize(JSON.parse(content), listEvents);
});*/
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */

 authorize: function(credentials, callback) {
  clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
          getNewToken((oauth2Client),function(token){
        callback(token);
    });
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
},
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
 getNewToken: function(oauth2Client,callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
},

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
storeToken: function(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
},

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
  room_freeSlot:function(auth,calendar_id,callback) {
    var calendar = google.calendar('v3');
    //var winterfell = calendar_Ids.Winterfell;
    //console.log(calendar.Get);
      var start_time = (new Date()).toISOString();
      var end_time = new Date();
      end_time.setHours(23);
      end_time.setMinutes(59);
      end_time.setSeconds(59);
      end_time = end_time.toISOString();

      calendar.events.list({
        auth: auth,
        calendarId: calendar_id,
        timeMin: start_time,//time
        timeMax: end_time,
        singleEvents: true,
        orderBy: 'startTime'
      },function(err, response) {
        if (err) {
          console.log('The API returned an error: ' + err);
          return;
        }
        var events = response.items;
        callback(events);
        });
    },

  insert:function (auth,calendar_id,user_id,description,start_time,end_time,callback)
  {
    var calendar = google.calendar('v3');
    var event = {
    'description': description,
    'start': {
      'dateTime': start_time
    },
    'extendedProperties':{
      'private':{
        'userId':userId
      }
    },
    'end': {
      'dateTime': end_time
    }
  };

  calendar.events.insert({
    auth: auth,
    calendarId: calendar_id,
    resource: event,
  }, function(err, event) {
    if (err) {
      console.log('There was an error contacting the Calendar service: ' + err);
    }
    console.log('Event created: %s', event.htmlLink);
    callback();
  });
  },
  user_events:function(auth,calendar_id,uId,callback)
  {
    var u={userId:uId};
    var calendar = google.calendar('v3');
    calendar.events.list(
      {
        auth : auth,
        calendarId : calendar_id,
        privateExtendedProperty: u
      },function(err,res)
      {
        if(err)
        {
          console.log("error in fetching userEvents");
          console.log(err);
        }
        else {
          callback(res.items);
        }
      }
    )
  },
  listEvents:function (auth , calendarId , sdateTime ,edateTime,callback) {
    var calendar = google.calendar('v3');
    calendar.events.list(
      {
        auth : auth,
        calendarId : calendarId,
        timeMin : sdateTime,
        timeMax : edateTime
      },function(err,res){
          if(err)
          {
              console.log(err);
          }
          else {
            callback(res.items);
          }
      });
  }
}
