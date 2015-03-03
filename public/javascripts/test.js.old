$(document).ready(function()
{
	var panels = [];
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	panels.push({bID: Math.floor((Math.random()*10000)+1), ID:Math.floor((Math.random()*10000)+1)});
	$('#origin').append('<p>test</p>');
	$('#origin').append('<img src="images/TOHRU_Hand.png" alt="TOHRU Hand Logo"></img>');
	panels.forEach(function(panel)
	{
		$('#origin').append('<div id="'+panel.bID+'"></div>');
		$('#'+panel.bID).append('<div class="panel" id="'+panel.ID+'">BLUH</div>');
	});
	panels.forEach(function(panel)
	{
		$('#'+panel.ID).slideDown('slow');
	});
	
	
	setInterval(function()
	{
		panels.forEach(function(panel)
		{
			$('#'+panel.ID).slideUp('slow');
		});
		panels.forEach(function(panel)
		{
			panel.ID = Math.floor((Math.random()*10000)+1);
		});
		panels.forEach(function(panel)
		{
			$('#'+panel.bID).append('<div class="panel" id="'+panel.ID+'">BLUH</div>');
		});
		panels.forEach(function(panel)
		{
			$('#'+panel.ID).slideDown('slow');
		});
	}, 1000);//*/
});
