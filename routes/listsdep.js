/*
 * THIS FILE IS DEPRECATED
 * This is what I used to use to do everything database.js does before websockets were implemented, just keeping around for reference
 */

var express = require('express');
var router = express.Router();
//var nano = require('nano')('http://localhost:5984');	//change to proper login
var nano = require('nano')('https://tohrutest:thisisthetohrupassword@tohrutest.couchappy.com:443');
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
		var db = nano.use('tohru');
		//any 'starter' documents to be created go here
	}
});
var db = nano.use('tohru');

router.post('/test', function(req, res)
{
	console.log(req.body.alpha);
});

/**
 * Simply check if a document exists for a particular meeting
 */
router.post('/meetexists', function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			res.json({exists:false});
		}
		else
		{
			res.json({exists:true});
		}
	});
});

/**
 * Function for checking validity of a password
 */
var modPassCheck = function(meeting, modpass, cb)
{
	db.get('##MODPASS##'+meeting, function(err, body)
	{
		if(err)
		{
			cb(false);
		}
		else
		{
			if(modpass == body.password)
			{
				cb(true);
			}
			else
			{
				cb(false);
			}
		}
	});
};

/**
 * Recursive function for registration
 */
updateRegister = function(db, meeting, username)
{
	db.get(meeting, function(err, body)
	{
		body.users.push({name: username});
		body.update = Date.now();
		db.insert(body, function(err, body)
		{
			if(err)
			{
				updateRegister(db, meeting, username);
			}
		});
	});
};

/**
 * Registers a new user in a meeting and gives them the meeting key.
 */
router.post('/register', function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			console.log('User "'+req.body.name+'" could not find meeting "'+req.body.meeting+'"');
			res.json({key:-52});
		}
		else
		{
			updateRegister(db, req.body.meeting, req.body.name);
			console.log('User "'+req.body.name+'" registered in meeting "'+req.body.meeting+'"');
			res.json({key: body.key});
		}
	});
});

/**
 * Registers a new moderator in a meeting and gives them the meeting key.
 */
router.post('/registermod', function(req, res)
{
	//var pass = modPassCheck(req.body.meeting, req.body.modpass);
	//console.log(pass);
	modPassCheck(req.body.meeting, req.body.modpass, function(check)
	{
		if(check)
		{
			db.get(req.body.meeting, function(err, body)
			{
				if(err)
				{
					res.json({key:-52});
				}
				else
				{
					updateRegister(db, req.body.meeting, req.body.name+' (Moderator)');
					console.log('User "'+req.body.name+'" registered with moderator access in meeting "'+req.body.meeting+'"');
					res.json({key: body.key});
				}
			});
		}
		else
		{
			console.log('User "'+req.body.name+'" attempted to gain moderator access to meeting "'+req.body.meeting+'" with invalid password "'+req.body.modpass+'"');
			res.json({key:-52});
		}
	});
});

/**
 * Checks to see if given password is valid
 */
router.post('/checkmod', function(req, res)
{
	modPassCheck(req.body.meeting, req.body.modpass, function(check)
	{
		if(check) res.json({pass:true});
		else res.json({pass:false});
	});
});

/**
 * Creates a new meeting
 */
router.post('/createnew', function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			var newMeeting = {
				key: Math.floor((Math.random()*10000000000000000000000)+1).toString(36),
				update: Date.now(),
				MOTD: '',
				hands: [],
				users: []
			};
			var newMod = {
				update: 0,
				email: req.body.email,
				password: req.body.modpass
			};
			db.insert(newMeeting, req.body.meeting);
			db.insert(newMod, '##MODPASS##'+req.body.meeting);
			console.log('New meeting registered as "'+req.body.meeting+'"');
			res.json({nameTaken: false});
		}
		else
		{
			console.log('Attempt to register "'+req.body.meeting+'", meeting already exists');
			res.json({nameTaken: true});
		}
	});
});

/**
 * Raises user's hand
 */
handRaise = function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			res.json({success:false});
		}
		else
		{
			var found = false;
			if(body.hands.length > 0)
			{
			for(i = 0; i < body.hands.length; i++)
			{
				if(body.hands[i].name == req.body.name && body.hands[i].ID == req.body.ID)
				{
					body.hands[i].type = req.body.hand.type;
					body.hands[i].comment = req.body.hand.comment;
					found = true;
				}
			}
			}
			if(!found)
			{
				body.hands.push({
					name: req.body.name,
					ID: req.body.ID,
					type: req.body.hand.type,
					comment: req.body.hand.comment
				});
			}
			body.update = Date.now();
			db.insert(body, function(err, body)
			{
				if(err)
				{
					handRaise(req, res);
				}
				else
				{
					console.log('User "'+req.body.name+'" raised his hand');
					res.json({success:true});
				}
			});
		}
	});
};
router.post('/raise', function(req, res){handRaise(req, res);});

/**
 * Lowers user's hand
 */
handLower = function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			res.json({success:false});
		}
		else
		{
			for(i = 0; i < body.hands.length; i++)
			{
				if(body.hands[i].name == req.body.name && body.hands[i].ID == req.body.ID)
				{
					body.hands.splice(i, 1);
				}
			}
			body.update = Date.now();
			db.insert(body, function(err, body)
			{
				if(err)
				{
					handLower(req, res);
				}
				else
				{
					console.log('User "'+req.body.name+'" lowered his hand');
					res.json({success:true});
				}
			});
		}
	});
};
router.post('/lower', function(req, res){handLower(req, res);});


totop = function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			res.json({});
		}
		else
		{
			var hand = {
				name: '',
				ID: '',
				type: '',
				comment: ''
			};
			body.hands.shift();
			for(i = 0; i < body.hands.length; i++)
			{
				if(body.hands[i].name == req.body.name && body.hands[i].ID == req.body.ID)
				{
					hand.name = body.hands[i].name;
					hand.ID = body.hands[i].ID;
					hand.type = body.hands[i].type;
					hand.comment = body.hands[i].comment;
					body.hands.splice(i, 1);
				}
			}
			body.hands.unshift(hand);
			body.update = Date.now();
			db.insert(body, function(err, body)
			{
				if(err)
				{
					totop(req, res);
				}
				else
				{
					console.log('User "'+req.body.name+'" was made speaker by mod');
					res.json({success:true});
				}
			});
		}
	});
};
router.post('/totop', function(req, res){totop(req, res);});

advance = function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			res.json({});
		}
		else
		{
			body.hands.shift();
			body.update = Date.now();
			db.insert(body, function(err, body)
			{
				if(err)
				{
					advance(req, res);
				}
				else
				{
					console.log('Queue advanced by mod');
					res.json({success:true});
				}
			});
		}
	});
};
router.post('/advance', function(req, res){advance(req, res);});


modnext = function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			res.json({});
		}
		else
		{
			var hand = {
				name: req.body.name,
				ID: req.body.ID,
				type: req.body.hand.type,
				comment: req.body.hand.comment
			};
			//body.hands.shift();
			body.update = Date.now();
			body.hands.unshift(hand);
			db.insert(body, function(err, body)
			{
				if(err)
				{
					modnext(req, res);
				}
				else
				{
					console.log('Moderator moved to current speaker');
					res.json({success: true});
				}
			});
		}
	});
};
router.post('/modnext', function(req, res){modnext(req, res);});

changeMOTD = function(req, res)
{
	db.get(req.body.meeting, function(err, body)
	{
		if(err)
		{
			res.json({});
		}
		else
		{
			body.update = Date.now();
			body.MOTD = req.body.hand.comment;
			db.insert(body, function(err, body)
			{
				if(err)
				{
					changeMOTD(req, res);
				}
				else
				{
					console.log('Moderator changed MOTD to '+req.body.hand.comment);
					res.json({success: true});
				}
			});
		}
	});
};
router.post('/changeMOTD', function(req, res){changeMOTD(req, res);});

/**
 * Fetches meeting data if the key matches
 */
router.get('/fetch', function(req, res)
{
	db.get(req.query.meeting, function(err, body)
	{
		if(err)
		{
			res.json({key: ''});
		}
		else
		{
			if(body.key == req.query.key)
			{
				res.json(body);
			}
			else
			{
				res.json({key: ''});
			}
		}
	});
});

buildEmail = function(email, rows, text, res)
{
	if(rows.length < 1)
	{
		mail.sendMail(
			{
				from: 'noreply@tohru.com',
				to: email,
				subject: 'TOHRU passwords',
				text: text
			}
		, function(error, info)
		{
			if(error)
			{
				console.log("EMAIL FAILED");
				console.log(error);
				res.json({success: false});
			}
			else
			{
				console.log("EMAIL SUCCESS");
				console.log(info);
				res.json({success: true});
			}
		});
	}
	else if(/\#\#MODPASS\#\#*/.test(rows[0].id))
	{
		db.get(rows[0].id, function(err, body)
		{
			if(!err && body.email == email)
			{
				text = text + 'ID: ' + body._id.split('##MODPASS##')[1] + ' Password: ' + body.password + '\n';
			}
			rows.splice(0,1);
			buildEmail(email, rows, text, res);
		});
	}
	else
	{
		rows.splice(0,1);
		buildEmail(email, rows, text, res);
	}
};
/**
 * Sends meeting names and passwords associated with given email to that email
 */
router.post('/email', function(req, res)
{
	var reply = 'ALL TOHRU MEETINGS LINKED TO THIS ACCOUNT:\n\n';
	
	db.list(function(err, body) {
		if (!err) buildEmail(req.body.email, body.rows, reply, res);
		else
			console.log(err);
	}); 
});




/*
var http = require('http').Server(express);
var io = require('socket.io')(http);

io.on('connection', function(socket)
{
	console.log('USER CONNECTED');
	socket.on('disconnect', function()
	{
		console.log('USER DISCONNECTED');
	});
	socket.on('chat message', function(msg)
	{
		console.log('message: ' + msg);
		if(msg == 'D')
		{
			io.emit('beep');
		}
	});
});*/ 	

/*http.listen(3286, function()
{
	console.log('SOCKET LISTENING ON PORT 3286');
});*/

module.exports = router;