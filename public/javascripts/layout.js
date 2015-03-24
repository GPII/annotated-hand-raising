var PageLayout = {
	loaded: false,
	//WelcomeScreen: '<p>WELCOME TO TOHRU</p><p>Name(affil.): <input type="text" id="namefield" value="UserInfo.name"></input></p><p>Meeting Name:<input type="text" id="meetingfield" value="UserInfo.meeting"></input></p><p><button onclick="WelcomeScreen.create();">Create Meeting</button><button onclick="WelcomeScreen.join();">Join Meeting</button><button onclick="WelcomeScreen.modpass();">Login as Moderator</button></p>',
	WelcomeScreen: '',
	//ModPassScreen: '<p>Please Enter the Moderator Password for "<span id="MEETINGNAME">[MEETING NAME]</span>"</p><p>Password:<input type="password" id="passfield" value=""> <button onclick="ModPassScreen.submit()">Login</button><button onclick="ModPassScreen.goback()">Go Back</button></p>',
	ModPassScreen: '',
	//CreateScreen: '<p>Create a New Meeting:</p><p id="meetingline">Meeting Name:<input type="text" id="meetingfield" value="UserInfo.meeting"></p><p id="passline">Moderator Password:<input type="password" id="passfield" value=""></p><p id="buttonline"><button onclick="CreateScreen.create();">Create Meeting</button><button onclick="CreateScreen.goback();">Go Back</button></p>',
	CreateScreen: '',
	//MainScreen: '<div><table><tr><th rowspan="3"><img src="./images/TOHRU_Hand.png" height=80></th><td><p> </p></td></tr><tr><td valign="bottom"><span style="font-size: 30px">Trace Online Hand Raising Utility</span></td></tr><tr><td><span id="MOTD" style="font-size: 20px; color: #0000ff"></span></td></tr></table></div><div id="controls"></div><p><span style="background-color: #cccccc">Current Speaker: <span id="speaker"></span></span></p><div id="modcontrols"></div><div id="theList"></div><button onclick="MainScreen.userList();">Full Attendance List</button><button onclick="MainScreen.logOut();">Log Out</button>',
	MainScreen: '',
	controls: {
		//main: '<p><input id="comment" type="text" style="font-size: 16px; color: #777777" size=100 value="(optional) reminder/hint about what you are going to say" onclick="this.value=\'\'; this.onclick=\'\'; this.style.color=\'#000000\'"></p><p><button style="font-size: 16px" onclick="MainScreen.raise(\'S\');"><img src="./images/S_Icon.png" height=20 style="vertical-align:middle">ame Topic</button><button style="font-size: 16px" onclick="MainScreen.raise(\'N\');"><img src="./images/N_Icon.png" height=20 style="vertical-align:middle">ew Topic</button><button style="font-size: 16px" onclick="MainScreen.raise(\'A\');"><img src="./images/A_Icon.png" height=20 style="vertical-align:middle">nswer to Question</button><button style="font-size: 16px" onclick="MainScreen.raise(\'P\');"><img src="./images/P_Icon.png" height=20 style="vertical-align:middle">ropose Resolution</button></p>',
		main: '',
		//down: '<p><button onclick="MainScreen.down();">Lower Hand</button></p>',
		down: '',
		//modbox: '<p><button onclick="ModFunctions.advance()">Next Speaker</button><button onclick="ModFunctions.modnext()">Moderator Speaks Next</button></p>',
		modbox: '',
		modlegend: '',
		legend: ''
	},
	images: {
		TOHRU_Hand_crop: new Image()
	},
	init: function()
	{
		$.get('/pagelayout', function(data)
		{
			PageLayout.WelcomeScreen = data.split('<p>[WELCOME SCREEN]</p>')[1];
			PageLayout.ModPassScreen = data.split('<p>[MODPASS SCREEN]</p>')[1];
			PageLayout.CreateScreen = data.split('<p>[CREATE SCREEN]</p>')[1];
			PageLayout.MainScreen = data.split('<p>[MAIN SCREEN]</p>')[1];
			PageLayout.controls.main = data.split('<p>[CONTROLS-MAIN]</p>')[1];
			PageLayout.controls.down = data.split('<p>[CONTROLS-DOWN]</p>')[1];
			PageLayout.controls.modbox = data.split('<p>[CONTROLS-MODBOX]</p>')[1];
			PageLayout.controls.modlegend = data.split('<p>[MOD-LEGEND]</p>')[1];
			PageLayout.controls.legend = data.split('<p>[LEGEND]</p>')[1];
			AllSet = true;
		});
	},
	genListing: function(uid, name, ID, type, comment, isMine, isMod)	//generates the list entries
	{
		var reply = '<p class="handlisting" id='+uid+'>';
		if(isMod) reply += '<img src="./images/Delete_Icon.png" height=20 onclick="ModFunctions.forceDown(\''+name+'\', '+ID+');" style="vertical-align:middle">';
		reply += '<img src="./images/'+type+'_Icon.png" height=20 style="vertical-align:middle">';
		if(isMod) reply += '<img src="./images/Totop_Icon.png" height=20 onclick="ModFunctions.toTop(\''+name+'\', '+ID+');" style="vertical-align:middle">';
		if(isMine) reply += '<span style="color: blue">';
		reply += '<span style="font-weight: bold">';
		reply += '&nbsp &nbsp';
		reply += name;
		reply += '</span>';
		reply += '  ';
		if(comment != '') reply += '['+comment+']';
		if(isMine) reply += '</span>';
		reply += '</p>';
		return reply;
	}
};

$(document).ready(function()
{
	PageLayout.init();
});
