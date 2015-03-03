//Unique ID generator for JQuery HTML objects (for dynamic lists)
var IDGen = {
	UIDCounter: 0,	//global counter for ID assignment
	//creates a new ID string
	newID: function()
	{
		if(this.UIDCounter == Number.MAX_INTEGER)	//just in case :P
		{
			this.UIDCounter = 0;
		}
		var thisID = this.UIDCounter.toString(36);
		this.UIDCounter++;
		return 'uid'+thisID;
	},
	//creates and returns a new ID string tying it to obj as well
	genID: function(obj)
	{
		var id = this.newID();
		obj.ID = id;
		return id;
	}
};

/**
 * Functions for managing cookies stored in the browser data
 */
var cookies = {
	/**
	 * Stores all UserData entries in cookies, init is for first sign-in
	 */
	store: function(init)
	{
		exp = 24;	//number of hours before cookies expire
		cookies.set('alpha', 'omega');
		cookies.set('uname', UserInfo.name);
		cookies.set('uid', UserInfo.ID);
		cookies.set('umeeting', UserInfo.meeting);
		cookies.set('ukey', UserInfo.key);
		if(init) cookies.set('umodpass', UserInfo.modpass);
		else cookies.set('umodpass', this.get('umodpass'));
		cookies.set('uismod', UserInfo.isMod);
		cookies.set('uhraised', UserInfo.hand.raised);
		cookies.set('uhtype', UserInfo.hand.type);
		cookies.set('uhcomment', UserInfo.hand.comment);
	},
	/**
	 * Loads all UserData entries from cookies
	 */
	load: function()
	{
		if(cookies.get('alpha') == 'omega')	//checking to see if cookie values are there
		{
			UserInfo.name = cookies.get('uname');
			UserInfo.ID = cookies.get('uid');
			UserInfo.meeting = cookies.get('umeeting');
			UserInfo.key = cookies.get('ukey');
			UserInfo.modpass = cookies.get('umodpass');
			UserInfo.isMod = (cookies.get('uismod') == 'true');
			UserInfo.hand.raised = (cookies.get('uhraised') == 'true');
			UserInfo.hand.type = cookies.get('uhtype');
			UserInfo.hand.comment = cookies.get('uhcomment');
			return true;
		}
		else return false;
	},
	/**
	 * Initializes both the cookie and the UserInfo
	 */
	wipe: function()
	{
		if(cookies.get('alpha') == 'omega')
		{
			cookies.del('alpha');
			cookies.del('uname');
			cookies.del('uid');
			cookies.del('umeeting');
			cookies.del('ukey');
			cookies.del('umodpass');
			cookies.del('uismod');
			cookies.del('uhraised');
			cookies.del('uhtype');
			cookies.del('uhcomment');
			UserInfo = {
				name: '',
				ID: Math.floor((Math.random()*1000000)+1),
				meeting: '',
				key: '',
				modpass: '',
				isMod: false,
				hand: {
					raised: false,
					type: '',
					comment: ''
				}
			};
		}
	},
	/**
	 * Sets a single cookie value
	 */
	set: function(name, value)
	{
		var exhours = 24;	//number of hours before cookies expire
		var d = new Date();
		d.setTime(d.getTime() + exhours*60*60*1000);
		document.cookie = name + '=' + value + '; expires=' + d.toGMTString();
	},
	/**
	 * Gets a single cookie value
	 */
	get: function(name)
	{
		var cname = name + "=";
    	var ca = document.cookie.split(';');
    	for(var i=0; i<ca.length; i++)
    	{
    		var c = ca[i];
    		while (c.charAt(0)==' ') c = c.substring(1);
    		if (c.indexOf(cname) != -1) return c.substring(cname.length,c.length);
    	}
    return "";
	},
	/**
	 * Deletes a single cookie value
	 */
	del: function(name)
	{
		var d = new Date();
		d.setTime(0);
		document.cookie = name + '=' + name + '; expires=' + d.toGMTString();
	}
};

AllSet = false;
var socket = io(':3000');
var registered = false;
var showList = false;
var currentMOTD = '';

var UserInfo = {
	name: '',
	ID: Math.floor((Math.random()*1000000)+1),
	meeting: '',
	key: '',
	modpass: '',
	isMod: false,
	email: '',
	hand: {
		raised: false,
		type: '',
		comment: ''
	}
};

var WelcomeScreen = {
	load: function()
	{
		document.title = "TOHRU Login";
		$('#origin').empty();
		$('#origin').append(PageLayout.WelcomeScreen);
		$('#namefield').val(UserInfo.name);
		$('#meetingfield').val(UserInfo.meeting);
	},
	create: function()
	{
		UserInfo.name = $('#namefield').val();
		UserInfo.meeting = $('#meetingfield').val();
		CreateScreen.load();
	},
	join: function()
	{
		UserInfo.name = $('#namefield').val();
		UserInfo.meeting = $('#meetingfield').val();
		if($('#namefield').val() == '')
		{
			alert('Please input your name');
			WelcomeScreen.load();
		}
		else if($('#meetingfield').val() == '')
		{
			alert('Please input a meeting name');
			WelcomeScreen.load();
		}
		else
		{
			socket.emit('register', UserInfo.meeting, UserInfo.name, UserInfo.ID, function(pass)
			{
				if(pass)
				{
					cookies.store(true);
					UserInfo.modpass = '';
					registered = true;
					MainScreen.load();
				}
				else
				{
					alert('Error registering in meeting "'+UserInfo.meeting+'", please verify that the meeting name is correct');
					WelcomeScreen.load();
				}
			});
		}
	},
	modpass: function()
	{
		UserInfo.name = $('#namefield').val();
		UserInfo.meeting = $('#meetingfield').val();
		if($('#namefield').val() == '')
		{
			alert('Please input your name');
			WelcomeScreen.load();
		}
		else if($('#meetingfield').val() == '')
		{
			alert('Please input a meeting name');
			WelcomeScreen.load();
		}
		else
		{
			socket.emit('meetexists', UserInfo.meeting, function(response)
			{
				if(response)
				{
					ModPassScreen.load();
				}
				else
				{
					alert('No record found of meeting "'+UserInfo.meeting+'"');
					WelcomeScreen.load();
				}
			});
		}
	}
};

var ModPassScreen = {
	load: function()
	{
		document.title = "Enter Moderator Password";
		$('#origin').empty();
		$('#origin').append(PageLayout.ModPassScreen);
		$('#MEETINGNAME').empty();
		$('#MEETINGNAME').append(UserInfo.meeting);
	},
	submit: function()
	{
		UserInfo.modpass = $('#passfield').val();
		socket.emit('registermod', UserInfo.meeting, UserInfo.name, UserInfo.ID, UserInfo.modpass, function(pass)
		{
			if(pass)
			{
				//UserInfo.key = data.key;
				UserInfo.isMod = true;
				UserInfo.name = UserInfo.name;
				cookies.store(true);
				registered = true;
				MainScreen.load();
			}
			else
			{
				alert('Invalid password');
				ModPassScreen.load();
			}
		});
	},
	goback: function()
	{
		WelcomeScreen.load();
	}
};

var CreateScreen = {
	load: function()
	{
		document.title = "Create New TOHRU Meeting";
		$('#origin').empty();
		$('#origin').append(PageLayout.CreateScreen);
		$('#meetingfield').val(UserInfo.meeting);
	},
	create: function()
	{
		UserInfo.meeting = $('#meetingfield').val();
		UserInfo.modpass = $('#passfield').val();
		if($('#meetingfield').val() == '')
		{
			alert('Please input a meeting name');
			CreateScreen.load();
		}
		else if($('#passfield').val() == '')
		{
			alert('Please input a moderator password');
			CreateScreen.load();
		}
		else
		{
			socket.emit('createnew', UserInfo.meeting, '', UserInfo.modpass, function(pass)
			{
				if(pass)
				{
					alert('Meeting "'+UserInfo.meeting+'" registered');
					WelcomeScreen.load();
				}
				else
				{
					alert('Record for meeting "'+UserInfo.meeting+'" already exists');
					CreateScreen.load();
				}
			});
		}
	},
	checkunique: function()
	{
		UserInfo.meeting = $('#meetingfield').val();
		socket.emit('meetexists', UserInfo.meeting, function(exists)
		{
			if(exists)
			{
				alert('Meeting name already taken.');
			}
			else
			{
				alert('Meeting name is available!');
			}
		});
	},
	goback: function()
	{
		UserInfo.meeting = $('#meetingfield').val();
		WelcomeScreen.load();
	}
};

var MainScreen = {
	lastRev: '',
	load: function()
	{
		document.title = "TOHRU";
		//this.lastRev = '';
		$('#origin').empty();
		$('#origin').append(PageLayout.MainScreen);
		if(UserInfo.isMod) $('#origin').append(PageLayout.controls.modlegend);
		showList = true;
		socket.emit('gimmelist');
		this.drawControls();
	},
	drawControls: function()
	{
		$('#controls').empty();
		$('#modcontrols').empty();
		$('#controls').append(PageLayout.controls.main);
		if(UserInfo.hand.raised) $('#controls').append(PageLayout.controls.down);
		if(UserInfo.isMod)
		{
			$('#modcontrols').append(PageLayout.controls.modbox);
		}
		
	},
	raise: function(raisetype)
	{
		UserInfo.hand.type = raisetype;
		if($('#comment').val() != 'Optional reminder/hint') UserInfo.hand.comment = $('#comment').val();
		var rname = UserInfo.name;
		if(UserInfo.isMod) rname = UserInfo.name + ' (Moderator)';
		socket.emit('changehands', 'RAISE', {
			name: rname,
			ID: UserInfo.ID,
			type: UserInfo.hand.type,
			comment: UserInfo.hand.comment
		});
	},
	down: function()
	{
		var rname = UserInfo.name;
		if(UserInfo.isMod) rname = UserInfo.name + ' (Moderator)';
		socket.emit('changehands', 'LOWER', {
			name: rname,
			ID: UserInfo.ID
		});
	},
	userList: function()
	{
		showList = false;
		UserList.load();
	},
	logOut: function()
	{
		cookies.wipe();
		registered = false;
		WelcomeScreen.load();
	}
};

var UserList = {
	load: function() {
		$('#origin').empty();
		$('#origin').append('<p><button onclick="MainScreen.load();">Go Back</button></p>');
		$('#origin').append('<p>ONLINE USERS:</p>');
		socket.emit('userlist', function(data)
		{
			data.forEach(function(user)
			{
				$('#origin').append('<p>'+user+'</p>');
			});
		});
	}
};

var ModFunctions = {	//Holds all the shiny things mods can do
	forceDown: function(uname, uID)	//forces someone to put their hand down
	{
		socket.emit('changehands', 'LOWER', {
			name: uname,
			ID: uID
		});
	},
	toTop: function(uname, uID)	//forces someone to put their hand down
	{
		socket.emit('changehands', 'TOTOP', {
			name: uname,
			ID: uID
		});
	},
	suggest: function()
	{
		socket.emit('changehands', 'RAISE', {
			name: $('#suggestionbox').val(),
			ID: Math.floor((Math.random()*100000)+1),
			type: '+',
			comment: ''
		});
	},
	advance: function()
	{
		socket.emit('changehands', 'ADVANCE', {});
	},
	modnext: function()
	{
		socket.emit('changehands', 'MODNEXT', {});
	}
};

var firstConnect = true;
socket.on('connect', function()
{
	if(firstConnect)
	{
		firstConnect = false;
	}
	else	//connection reestablishment functions
	{
		if(registered)
		{
			if(UserInfo.isMod)
			{
				socket.emit('signinmod', UserInfo.meeting, UserInfo.name, UserInfo.ID, UserInfo.modpass, function(isok)
				{
					if(!isok)
					{
						ShowList = false;
						$('#origin').empty();
						alert('An error has occurred, please refresh the page');
					}
				});
			}
			else
			{
				socket.emit('signin', UserInfo.meeting, UserInfo.name, UserInfo.ID, function(isok)
				{
					if(!isok)
					{
						ShowList = false;
						$('#origin').empty();
						alert('An error has occurred, please refresh the page');
					}
				});
			}
		}
	}
});

socket.on('disconnect', function()
{
	
});

socket.on('updatelist', function(data)
{
	if(showList)
	{
		$('#speaker').empty();
		$('#theList').empty();
		var handup = false;
		if(data.hands.length == 0)
		{
			$('#speaker').append('NO HANDS RAISED');
		}
		else
		{
			if(data.hands[0].type != 'X')
			{
				$('#speaker').append(data.hands[0].name);
				if(data.hands[0].comment != '') $('#speaker').append(' ['+data.hands[0].comment+']');
			}
			else
			{
				$('#speaker').append('NO CURRENT SPEAKER');
			}
			var first = true;
			data.hands.forEach(function(hand)
			{
				if(first) first = false;
				else
				{
					if(hand.type != 'X')
					{
						$('#theList').append(PageLayout.genListing(IDGen.newID(), hand.name, hand.ID, hand.type, hand.comment, (hand.name==UserInfo.name&&hand.ID==UserInfo.ID), UserInfo.isMod));
					}
				}
				if(hand.name==UserInfo.name && hand.ID==UserInfo.ID)
				{
					var redraw = UserInfo.hand.raised;
					UserInfo.hand.raised = true;
					UserInfo.hand.type = hand.type;
					UserInfo.hand.comment = hand.comment;
					handup = true;
					if(!redraw)
					{
						MainScreen.drawControls();
					}
				}
			});
		}
		if(handup == false && UserInfo.hand.raised)
		{
			UserInfo.hand.raised = false;
			MainScreen.drawControls();
		}
	}
});

$(document).ready(function()
{
	PageLayout.init();
	var startup = setInterval(function()
	{
		if(AllSet)
		{
			AllSet = false;
			clearInterval(startup);
			if(cookies.load())
			{
				if(UserInfo.isMod)
				{
					socket.emit('signinmod', UserInfo.meeting, UserInfo.name, UserInfo.ID, UserInfo.modpass, function(isok)
					{
						if(isok)
						{
							cookies.store();
							registered = true;
							MainScreen.load();
						}
						else
						{
							alert('ERROR: Stored credentials are invalid, please re-register');
							cookies.wipe();
							WelcomeScreen.load();
						}
					});
				}
				else
				{
					socket.emit('signin', UserInfo.meeting, UserInfo.name, UserInfo.ID, function(isok)
					{
						if(isok)
						{
							cookies.store();
							registered = true;
							MainScreen.load();
						}
						else
						{
							alert('ERROR: Stored credentials are invalid, please re-register');
							cookies.wipe();
							WelcomeScreen.load();
						}
					});
				}
				/*
				socket.emit('meetexists', UserInfo.meeting, function(exists)
				{
					if(exists)
					{
						if(UserInfo.isMod == true)
						{
							$.post('/list/checkmod', UserInfo, function(data)
							{
								if(data.pass)
								{
									cookies.store();
									MainScreen.load();
								}
								else
								{
									alert('Stored password is invalid for this meeting!');
									cookies.wipe();
									WelcomeScreen.load();
								}
							});
						}
						else
						{
							cookies.store();
							MainScreen.load();
						}
					}
				});
				*/
			}
			else
			{
				cookies.wipe();
				WelcomeScreen.load();
			}
		}
	}, 50);
});
