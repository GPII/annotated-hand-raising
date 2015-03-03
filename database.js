var nano = require('nano')('http://localhost:5984');	//local hosting
//var nano = require('nano')('https://tohrutest:thisisthetohrupassword@tohrutest.couchappy.com:443');	//remote hosting
var nodemailer = require('nodemailer');
var mail = nodemailer.createTransport(
/*	{
		service: 'gmail',
		debug: true,
		auth: {
			user: '',
			pass: ''
		}
	}*/
);

////////DATABASE SETUP////////
nano.db.list(function(err, body)
{
	var dbPresent = false;
	body.forEach(function(db)
	{
		if(db === 'tohru')
		{
			dbPresent = true;
		}
	});
	if(!dbPresent)	//Create TOHRU database
	{
		nano.db.create('tohru');
		//var db = nano.use('tohru'); //uncomment if you actually HAVE any starter documents :P
		//any 'starter' documents to be created go here (uncomment prev line first)
	}
});
var db = nano.use('tohru');
console.log("DATABASE ONLINE");

/**
 * Check to see if a meeting exists
 * @param {String} mname name of the meeting
 * @param {Function} reply callback function
 */
function meetexists(mname, reply)
{
	db.get("##SECURITY##"+mname, function(err, body)	//security fetched due to having lowest file size
	{
		if(err) reply(false);
		else reply(true);
	});
}

/**
 * Creates a new meeting with the given parameters
 * @param {String} mname name of the meeting
 * @param {String} memail email to associate with the meeting
 * @param {String} modpass moderator password
 * @param {Function} reply callback function, true if successful false if meeting exists
 */
function createMeeting(mname, memail, modpass, reply)
{
	meetexists(mname, function(exists)
	{
		if(exists)
		{
			console.log('<EVENT> User attemted to register meeting "'+mname+'", but meeting already exists');
			reply(false);
		}
		else
		{
			var pregistry = {
				cdate: Date.now(),
				users: []
			};
			var phands = {
				cdate: Date.now(),
				hands: []
			};
			var psecurity = {
				cdate: Date.now(),
				email: memail,
				password: modpass
			};
			db.insert(pregistry, '##REGISTRY##'+mname);
			db.insert(phands, '##HANDS##'+mname);
			db.insert(psecurity, '##SECURITY##'+mname);
			console.log('<EVENT> User has registered new meeting "'+mname+'"');
			reply(true);
		}
	});
}

/**
 * Recursively inserts a username into a registry.
 */
function insertUser(mname, user)
{
	db.get('##REGISTRY##'+mname, function(err, body)
	{
		if(!err)
		{
			body.users.push(user);
			db.insert(body, function(err, body)
			{
				if(err)
				{
					insertUser(mname, user);
				}
			});
		}
	});
}

/**
 * Adds a new participant to the meeting registry and signs them in
 * @param {Object} socket the Socket object
 * @param {String} mname name of the meeting
 * @param {String} name name of the participant
 * @param {Integer} ID unique number used to differentiate between duplicates
 * @param {Function} reply callback function
 */
function register(socket, mname, name, ID, reply)
{
	db.get('##REGISTRY##'+mname, function(err, registry)
	{
		if(err)
		{
			console.log('<EVENT> User attempted to register in nonexistent meeting "'+mname+'"');
			reply(false);
		}
		else
		{
			var found = false;
			if(registry.users.length > 0)
			{
				for(i = 0; i < registry.users.length; i++)
				{
					if(registry.users[i].name == name && registry.users[i].ID == ID)
					{
						found = true;
					}
				}
			}
			if(found)
			{
				console.log('<EVENT> User attempted to register in meeting "'+mname+'" with credentials in use');
				reply(false);
			}
			else
			{				//REGISTER SOCKET AND ADD TO REGISTRY
				socket.name = name;
				socket.ID = ID;
				socket.mname = mname;
				socket.isMod = false;
				socket.join(mname);
				socket.registered = true;
				var user = {
					name: name,
					ID: ID,
					date: Date.now(),
					isMod: false
				};
				insertUser(mname, user);
				console.log('<EVENT> User registered in meeting "'+mname+'" as "'+name+'"');
				reply(true);
			}
		}
	});
}

/**
 * Adds a new moderator to the meeting registry and signs them in
 * @param {Object} socket the Socket object
 * @param {String} mname name of the meeting
 * @param {String} name name of the participant
 * @param {Integer} ID unique number used to differentiate between duplicates
 * @param {String} modpass moderator password
 * @param {Function} reply callback function
 */
function registermod(socket, mname, name, ID, modpass, reply)
{
	db.get('##REGISTRY##'+mname, function(err, registry)
	{
		if(err)
		{
			console.log('<EVENT> User attempted to register in nonexistent meeting "'+mname+'"');
			reply(false);
		}
		else
		{
			db.get('##SECURITY##'+mname, function(err, security)
			{
				
				if(err)
				{
					console.log('<EVENT> User attempted to register as moderator in nonexistent meeting "'+mname+'"');
					reply(false);
				}
				else
				{
					if(modpass == security.password)
					{
						var found = false;
						if(registry.users.length > 0)
						{
							for(i = 0; i < registry.users.length; i++)
							{
								if(registry.users[i].name == name && registry.users[i].ID == ID)
								{
									found = true;
								}
							}
						}
						if(found)
						{
							console.log('<EVENT> User attempted to register as moderator in meeting "'+mname+'" with credentials in use');
							reply(false);
						}
						else
						{				//REGISTER SOCKET AND ADD TO REGISTRY
							socket.name = name;
							socket.ID = ID;
							socket.mname = mname;
							socket.isMod = true;
							socket.join(mname);
							socket.registered = true;
							var user = {
								name: name,
								ID: ID,
								date: Date.now(),
								isMod: false
							};
							insertUser(mname, user);
							console.log('<EVENT> User registered as moderator in meeting "'+mname+'" as "'+name+'"');
							reply(true);
						}
					}
					else
					{
						console.log('<EVENT> User attempted to register as moderator in meeting "'+mname+'" with invalid password');
						reply(false);
					}
				}
			});
		}
	});
}

/**
 * Used to re-signin from cookies in case of page refresh or dropped connection
 * @param {Object} socket the Socket object
 * @param {String} mname name of the meeting
 * @param {String} name name of the participant
 * @param {Integer} ID unique number used to differentiate between duplicates
 * @param {Function} reply callback function
 */
function signin(socket, mname, name, ID, reply)
{
	db.get('##REGISTRY##'+mname, function(err, registry)
	{
		if(err)
		{
			console.log('<EVENT> User attempted to sign in to nonexistent meeting "'+mname+'"');
			reply(false);
		}
		else
		{
			var found = false;
			if(registry.users.length > 0)
			{
				for(i = 0; i < registry.users.length; i++)
				{
					if(registry.users[i].name == name && registry.users[i].ID == ID)
					{
						found = true;
					}
				}
			}
			if(found)
			{				//REGISTER SOCKET
				socket.name = name;
				socket.ID = ID;
				socket.mname = mname;
				socket.isMod = false;
				socket.join(mname);
				socket.registered = true;
				console.log('<EVENT> Returning user "'+name+'" signed into meeting "'+mname+'"');
				reply(true);
			}
			else
			{
				console.log('<EVENT> User attempted to sign in to meeting "'+mname+'" with invalid credentials');
			}
		}
	});
}

/**
 * Used to re-signin from cookies as a moderator in case of page refresh or dropped connection
 * @param {Object} socket the Socket object
 * @param {String} mname name of the meeting
 * @param {String} name name of the participant
 * @param {Integer} ID unique number used to differentiate between duplicates
 * @param {String} modpass moderator password (ignored if isMod not flagged)
 * @param {Function} reply callback function
 */
function signinmod(socket, mname, name, ID, modpass, reply)
{
	db.get('##REGISTRY##'+mname, function(err, registry)
	{
		if(err)
		{
			console.log('<EVENT> User attempted to sign in as moderator to nonexistent meeting "'+mname+'"');
			reply(false);
		}
		else
		{
			db.get('##SECURITY##'+mname, function(err, security)
			{
				
				if(err)
				{
					console.log('<EVENT> User attempted to sign in as moderator to nonexistent meeting "'+mname+'"');
					reply(false);
				}
				else
				{
					if(modpass == security.password)
					{
						var found = false;
						if(registry.users.length > 0)
						{
							for(i = 0; i < registry.users.length; i++)
							{
								if(registry.users[i].name == name && registry.users[i].ID == ID)
								{
									found = true;
								}
							}
						}
						if(found)
						{				//REGISTER SOCKET
							socket.name = name;
							socket.ID = ID;
							socket.mname = mname;
							socket.isMod = true;
							socket.join(mname);
							socket.registered = true;
							console.log('<EVENT> Returning moderator "'+name+'" signed into meeting "'+mname+'"');
							reply(true);
						}
						else
						{
							console.log('<EVENT> User attempted to sign in as moderator to meeting "'+mname+'" with invalid credentials');
							reply(false);
						}
					}
					else
					{
						console.log('<EVENT> User attempted to sign in as moderator to meeting "'+mname+'" with invalid password');
						reply(false);
					}
				}
			});
		}
	});
}

/**
 * Sends an updated list to the specified recipient(s)
 * @param {Object} recipient socket(s) to emit new list to
 * @param {String} mname name of the meeting
 */
function updatehands(recipient, mname)
{
	db.get('##HANDS##'+mname, function(err, doc)
	{
		if(err)
		{
			updatehands(recipient, mname);
		}
		else
		{
			recipient.emit('updatelist', doc);
		}
	});
}

/**
 * Recursively makes a specified alteration to a meeting's hands list
 * @param {Object} the socket issuing the command
 * @param {String} command action to perform
 * @param {Object} data all appropriate data to perform action
 * @param {Function} reply function to run after completion, returns true/false based on success
 */
function changehands(socket, command, data, reply)
{
	db.get('##HANDS##'+socket.mname, function(err, doc)
	{
		if(err)
		{
			reply(false);
		}
		else
		{
			var success = true;	//able to force an error if execution goes bad (or authorization failure occurs)
			if(command == "RAISE")
			{
				if(socket.name != data.name && !socket.isMod)	//security check
				{
					success = false;
					console.log('<EVENT> user "' + socket.name + '" attempted unauthorized command');
				}
				else
				{
					var found = false;
					if(doc.hands.length > 0)
					{
						for(i = 0; i < doc.hands.length; i++)
						{
							if(doc.hands[i].name == data.name && doc.hands[i].ID == data.ID)
							{
								doc.hands[i].type = data.type;
								doc.hands[i].comment = data.comment;
								found = true;
							}
						}
					}
					if(!found)
					{
						var entry = {
							name: data.name,
							ID: data.ID,
							type: data.type,
							comment: data.comment
						};
						doc.hands.push(entry);
					}
					console.log('<EVENT> user "' + socket.name + '" raised hand of user "' + data.name + '"');
				}
			}
			else if(command == "LOWER")
			{
				if(socket.name != data.name && !socket.isMod)	//security check
				{
					success = false;
					console.log('<EVENT> user "' + socket.name + '" attempted unauthorized command');
				}
				else
				{
					if(doc.hands.length > 0)
					{
						for(i = 0; i < doc.hands.length; i++)
						{
							if(doc.hands[i].name == data.name && doc.hands[i].ID == data.ID)
							{
								doc.hands[i] = {	//scrubs it as a blank entry
									name: '',
									ID: 0,
									type: 'X',
									comment: ''
								};
							}
						}
					}
					console.log('<EVENT> user "' + socket.name + '" lowered hand of user "' + data.name + '"');
				}
			}
			else if(command == "TOTOP")
			{
				if(!socket.isMod)
				{
					success = false;
					console.log('<EVENT> user "' + socket.name + '" attempted unauthorized command');
				}
				else
				{
					var hand = {
						name: '',
						ID: 0,
						type: '',
						comment: ''
					};
					for(i = 0; i < doc.hands.length; i++)
					{
						if(doc.hands[i].name == data.name && doc.hands[i].ID == data.ID)
						{
							hand.name = doc.hands[i].name;
							hand.ID = doc.hands[i].ID;
							hand.type = doc.hands[i].type;
							hand.comment = doc.hands[i].comment;
							doc.hands.splice(i, 1);
						}
					}
					doc.hands.unshift(hand);
					
					console.log('<EVENT> user "' + socket.name + '" moved user "' + data.name + '" to top of queue');
				}
			}
			else if(command == "MODNEXT")
			{
				if(!socket.isMod)
				{
					success = false;
					console.log('<EVENT> user "' + socket.name + '" attempted unauthorized command');
				}
				else
				{
					var modtag = '[[MODERATOR (' + socket.name + ')]]';
					doc.hands.unshift({
						name: modtag,
						ID: 0,
						type: '+',
						comment: ''
					});
					console.log('<EVENT> user "' + socket.name + '" interrupted top of queue');
				}
			}
			else if(command == "ADVANCE")
			{
				if(!socket.isMod)
				{
					success = false;
					console.log('<EVENT> user "' + socket.name + '" attempted unauthorized command');
				}
				else
				{
					if(doc.hands.length > 0)
					{
						do
						{
							doc.hands.shift();
							if(doc.hands.length <= 0) break;
						}
						while(doc.hands[0].type == 'X');
					}
					console.log('<EVENT> user "' + socket.name + '" advanced queue');
				}
			}
			
			if(success)
			{
				db.insert(doc, function(err, doc)
				{
					if(err)
					{
						changehands(socket, command, data, reply);
					}
					else
					{
						updatehands(socket.to(socket.mname), socket.mname);
						updatehands(socket, socket.mname);
						reply(true);
					}
				});
			}
			else
			{
				reply(false);
			}
		}
	});
}

var io;

var database = {
	activate: function(server)
	{
		io = require('socket.io').listen(server);
		io.sockets.on('connection', function(socket)
		{
			console.log('<EVENT> User connected');
			socket.on('disconnect', function()
			{
				console.log('<EVENT> User disconnected');
			});
			socket.on('meetexists', function(mname, reply)
			{
				meetexists(mname, reply);
			});
			socket.on('createnew', function(mname, memail, modpass, reply)
			{
				createMeeting(mname, memail, modpass, reply);
			});
			socket.on('register', function(mname, name, ID, reply)
			{
				register(socket, mname, name, ID, reply);
			});
			socket.on('registermod', function(mname, name, ID, modpass, reply)
			{
				registermod(socket, mname, name, ID, modpass, reply);
			});
			socket.on('signin', function(mname, name, ID, reply)
			{
				signin(socket, mname, name, ID, reply);
			});
			socket.on('signinmod', function(mname, name, ID, modpass, reply)
			{
				signinmod(socket, mname, name, ID, modpass, reply);
			});
			socket.on('gimmelist', function()
			{
				if(socket.registered) {updatehands(socket, socket.mname);}
			});
			socket.on('changehands', function(command, data)
			{
				if(socket.registered) {changehands(socket, command, data, function(success){});}
			});
			socket.on('userlist', function(reply)
			{
				var res = []
				, ns = io.of('/');
				if(ns)
				{
					for(var id in ns.connected)
					{
						if(socket.mname)
						{
							var index = ns.connected[id].rooms.indexOf(socket.mname);
							if(index !== -1)
							{
								res.push(ns.connected[id].name);
							}
						}
					}
				}
				reply(res);
			});
		});
		console.log("SERVER ACTIVE");
	}
};

module.exports = database;