var config = require('./config.js');
var flock = require('flockos');
var express = require('express');
var url = require('url');
var queryString = require('querystring');
var fs = require('fs');

var calendarIds;
fs.readFile('calendarIds.json',function(err,content)
{
	if(err)
	{
		console.log("error reading rooms IDs");
	}
	else {
		calendarIds = JSON.parse(content);
	}
});

var auth;
var gapi = require('./calendar_api.js');
var api_user_credentials;
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Google Calendar API.
	else {
		api_user_credentials = JSON.parse(content);
		auth = gapi.authorize(api_user_credentials, function(token){
			auth= token;
			//console.log(auth);
		});
	}
});

function start_time_for_filter()
{
	var start_time;
	return function(){
		start_time = (new Date()).toISOString();
	}
}

flock.appId = config.appId;
flock.appSecret = config.appSecret;

var app= express();
app.use(flock.events.tokenVerifier);
app.post('/events', flock.events.listener);

/*
var winterfell_time = start_time_for_filter();
var kingslanding_time = start_time_for_filter();
var dragonstone_time = start_time_for_filter();
var meetingroom1_time = start_time_for_filter();
var meetingroom2_time = start_time_for_filter();

function reset_times()
{
	winterfell_time.start_time = new Date().toISOString();
	kingslanding_time.start_time = new Date().toISOString();
	dragonstone_time.start_time = new Date().toISOString();
	meetingroom1_time.start_time = new Date().toISOString();
	meetingroom2_time.start_time = new Date().toISOString();
}
*/

app.use('/home', function(req, res) {
	//computation for calculation of time wrt each room
	var query = req.query;
	userId = query.userId; //here is userId is parsed from request for user specific events
	//console.log(auth);//it might be called before google return oauth2Client
	//check if auth is very working when token is not stored in local
	//reset_times();
	var schedules = {};
	var number_of_rooms = 5;
	while(auth == null){}

	var schedules_received = (function(){
		var count = 0;
		return function(){
			count += 1;
			if(count == number_of_rooms){
				send_schedules();
			}
		}
	})();

	function send_schedules(){
		console.log(schedules);
		res.render('home.ejs',{data : schedules});
	}
	function process_slots(schedule)
	{
		var start = end = new Date();
		start = start.toISOString();
		var start_index = 0;
		var slots = [];
		if(schedule.length > 0 && new Date() >= new Date(schedule[0].start.dateTime))
		{
			start_index = 1;
			while(start_index < schedule.length &&schedule[start_index].start.dateTime == schedule[start_index - 1].end.dateTime)
			{
				start_index++;
			}
			console.log(start_index);
			start = schedule[start_index-1].end.dateTime ;
		}
		slots.push(start);
		end.setDate(1+end.getDate());
		end.setHours(0);
		end.setMinutes(0);
		end.setSeconds(0);
		for(var i=start_index; i < schedule.length ; i++)
		{
			var temp = schedule[i];
			slots.push( temp.start.dateTime );
			while(i < schedule.length - 1 && schedule[i].end.dateTime == schedule[i+1].start.dateTime)
			{
				i++;
			}
			temp = schedule[i].end.dateTime;
			if(temp == end.toISOString())
				continue;
			slots.push( temp );
		}
		if(i>0 && end.toISOString() == schedule[i-1].end.dateTime)
			return slots;
		slots.push(end.toISOString());
		return slots;
	}
	//console.log(winterfell_time.start_time);
	gapi.room_freeSlot(auth,calendarIds.Winterfell,function(winterfell_schedule){
		/*if(winterfell_schedule.length != 0){
			var temp = winterfell_time.start_time;
			winterfell_time.start_time = winterfell_schedule[0].end.dateTime;
			winterfell_schedule[0].end.dateTime = winterfell_schedule[0].start.dateTime;
			winterfell_schedule[0].start.dateTime = temp;
		}*/
		schedules["winterfell"]= process_slots(winterfell_schedule);
		schedules_received();
	});

	gapi.room_freeSlot(auth,calendarIds.Kings_Landing,function(kingslanding_schedule){
		/*if(kingslanding_schedule.length !=0 ){
			var temp = kingslanding_time.start_time;
			kingslanding_time.start_time = kingslanding_schedule[0].end.dateTime;
			kingslanding_schedule[0].end.dateTime = kingslanding_schedule[0].start.dateTime;
			kingslanding_schedule[0].start.dateTime = temp;
		}*/
		schedules["kingslanding"] = process_slots(kingslanding_schedule);
		schedules_received();
	});

	gapi.room_freeSlot(auth,calendarIds.Dragonstone,function(dragonstone_schedule){
		/*if(dragonstone_schedule.length != 0){
			var temp = dragonstone_time.start_time;
			dragonstone_time.start_time = dragonstone_schedule[0].end.dateTime;
			dragonstone_schedule[0].end.dateTime = dragonstone_schedule[0].start.dateTime;
			dragonstone_schedule[0].start.dateTime = temp;
		}*/
		schedules["dragonstone"] = process_slots(dragonstone_schedule);
		schedules_received();
	});

	gapi.room_freeSlot(auth,calendarIds.Meeting_Room_1,function(meetingroom1_schedule){
		/*if(meetingroom1_schedule.length != 0){
			var temp = meetingroom1_time.start_time;
			meetingroom1_time.start_time = meetingroom1_schedule[0].end.dateTime;
			meetingroom1_schedule[0].end.dateTime = meetingroom1_schedule[0].start.dateTime;
			meetingroom1_schedule[0].start.dateTime = temp;
		}*/
		schedules["meetingroom1"] = process_slots(meetingroom1_schedule);
		schedules_received();
	});

	gapi.room_freeSlot(auth,calendarIds.Meeting_Room_2,function(meetingroom2_schedule){
		/*if(meetingroom2_schedule.length != 0){
			var temp = meetingroom2_time.start_time;
			meetingroom2_time.start_time = meetingroom2_schedule[0].end.dateTime;
			meetingroom2_schedule[0].end.dateTime = meetingroom2_schedule[0].start.dateTime;
			meetingroom2_schedule[0].start.dateTime = temp;
		}*/
		schedules["meetingroom2"]=process_slots(meetingroom2_schedule);
		schedules["userId"] = userId;
		schedules_received();
	});

});

/*app.use('/nextslot',function(req,res)
{
	var theurl = url.parse(req.url);
	var query_object = queryString.parse(theurl.query);

});*/

app.use('/select_booktime', function(req, res) {
	var data={};
	var theurl = url.parse(req.url);
	var query_object = queryString.parse(theurl.query);
	data["userId"]=query_object.userId;
	data["room"] = query_object.room;
	res.render("select_booktime",{data:data});
	//gapi.insert(auth,query_object.calendarId,query_object.summary,query_object.start_time,query_object.end_time);
});

app.use("/user_events", function(req, res) {
	//to display events corresponding to a user
	function userevents()
	{
		return function()
		{
			var start,end,description;
		}
	}
	var data={};
	var query=req.query;
	var flockEvent = JSON.parse(query.flockEvent);
	var userId = flockEvent.userId;
	data["userId"] = userId;
	console.log(userId);
	while(auth == null){}
	function timetostring(date)
	{
		var temp = new Date(date);
		var ans="";
		if(temp.getHours()<10)
		{
			ans += '0';
			ans+= temp.getHours();
		}
		else {
			ans += temp.getHours();
		}
		ans+=":";
		if(temp.getMinutes()<10)
		{
			ans+='0';
			ans+=temp.getMinutes();
		}
		else {
			ans+= temp.getMinutes();
		}
	}
	function check_retrieval()
	{
		var count =0;
		return function(){
			count++;
			if(count == 5)
			{
				send_events();
			}
		};
	}
	function send_events()
	{
		res.render("user_events",{data: data});
	}
	function process_events(events)
	{
		console.log(events);
		console.log("klasjdfhkla/snfladslkf");
		var timeslots=[];
		for(var i=0;i<events.length;i++)
		{
			var x = userevents();
			x.start = timetostring(events[i].start.dateTime);
			x.end = timetostring(events[i].end.dateTime);
			x.description = events[i].description;
			timeslots.push(x);
		}
		return timeslots;
	}
	var counter = check_retrieval();
	gapi.user_events(auth,calendarIds.Winterfell,userId,function(events){
		data["winterfell"]=process_events(events);
		counter();
	});
	gapi.user_events(auth,calendarIds.Winterfell,userId,function(events)
	{
		data["dragonstone"]=process_events(events);
		counter();
	});
	gapi.user_events(auth,calendarIds.Winterfell,userId,function(events)
	{
		data["kingslanding"]=process_events(events);
		counter();
	});
	gapi.user_events(auth,calendarIds.Winterfell,userId,function(events)
	{
		data["meetingroom1"]=process_events(events);
		counter();
	});
	gapi.user_events(auth,calendarIds.Winterfell,userId,function(events)
	{
		data["meetingroom2"]=process_events(events);
		counter();

	});
});

app.use("/book_room",function(req,res){
	var query = req.query;
	var room = query.room;
	calendarId = calendarIds[room];
	userId = query.userId;
	var stime= query.stime.split(":");
	var shours = parseInt(stime[0].trim());
	var sminutes = parseInt(stime[1].trim());
	description = query.description;
	var etime= query.etime.split(":");
	var ehours = parseInt(etime[0].trim());
	var eminutes = parseInt(etime[1].trim());
	var sdateTime = new Date();
	var edateTime = new Date();
	sdateTime.setHours(shours);
	sdateTime.setMinutes(sminutes);
	sdateTime.setSeconds(0);
	edateTime.setHours(ehours);
	edateTime.setMinutes(eminutes);
	edateTime.setSeconds(0);
	gapi.listEvents(auth,calendarId,sdateTime.toISOString(),edateTime.toISOString(),function(listofevents){
		if(listofevents.length > 0)
		{
			res.render("error",{data:query});
		}
		else {
			gapi.insert(auth,calendarId,userId,description,sdateTime.toISOString(),edateTime.toISOString(),function(){
					res.render("success");
			});
		}
	});
});
// set view engine to ejs
app.set('view engine', 'ejs');

// set view folder for ejs
app.set('views','./views');

// set static folder for assests
app.use(express.static('public'));

app.listen(8080, function () {
    console.log('Listening on 8080');
});

flock.events.on('app.install' , function (event, callback){
	callback();
});
