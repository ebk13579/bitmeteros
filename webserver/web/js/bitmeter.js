// The 'model' contains the application state
var model = buildModel();

// Manages the automatic screen refreshes
var refreshTimer;

// Prevent AJAX GET requests from being cached on IE
$.ajaxSetup({
    cache: false
});

// Help dialogs use these config values
var dialogOpts = {
	autoOpen : false,
	buttons :  { "OK" : function() { $(this).dialog("close"); }},
	height: 250,
	width: 400
};

// Used to parse server responses into JS objects
function doEval(objTxt){
	try{
		return eval('(' + objTxt + ')');
	} catch (e){
		return {};
	}
}

// Helpful when developing
var assert = (function(){
	var DO_ASSERT = true;
	return function(expr, msg){
		if (DO_ASSERT && !expr){
			msg = msg || 'Assertion Error';
			alert(msg);
			throw msg;	
		}
	};
})();

// Get current time in seconds
function getTime(){
	return Math.floor((new Date()).getTime() / 1000);
}

// Add leading zero to values less than 10
function zeroPad(val){
	if (val < 10){
		return '0' + val;
	} else {
		return '' + val;
	}
}

// Convert an integer UL/DL value into a 2-dp floating point value with 2 letter abbreviation
var formatAmount = (function(){
	var K=1024;
	var KB_MIN = K;
	var MB_MIN = KB_MIN * K;
	var GB_MIN = MB_MIN * K;
	var TB_MIN = GB_MIN * K;
	var PB_MIN = TB_MIN * K;
	var EB_MIN = PB_MIN * K;

	return function (amt){
		var numAmt, units;
		if (amt < KB_MIN){
			numAmt = amt.toFixed(2);
			units = 'B';
		} else if (amt < MB_MIN){
			numAmt = (amt/KB_MIN).toFixed(2);
			units = 'kB';
		} else if (amt < GB_MIN){
			numAmt = (amt/MB_MIN).toFixed(2);
			units = 'MB';
		} else if (amt < TB_MIN){
			numAmt = (amt/GB_MIN).toFixed(2);
			units = 'GB';
		} else if (amt < PB_MIN){
			numAmt = (amt/TB_MIN).toFixed(2);
			units = 'TB';
		} else {
			numAmt = (amt/PB_MIN).toFixed(2);
			units = 'PB';
		}
		return numAmt + ' ' + units;
	};
})();

// Adjust the vertical scale of a graph
var applyScale = (function(){
	var MIN_SCALE = 4;
	return function(graph, newScale){
		if (newScale >= MIN_SCALE){
			graph.getOptions().yaxis.max = newScale;
			graph.setupGrid();
			graph.draw();
			return true;
		} else {
			return false;
		}
	};
})();

var makeYAxisIntervalFn = (function(targetTickCount){
 /* Build a function that can be used to calculate vertical scale values that should be used on the graphs,
    we want the values to be nicely rounded (eg 350.00 kb/s not 357.23 kb/s) and to be able to vary how many
    we get for each graph, also needs to work at any scale. */
	return function(axis){
		var K = 1024;
		var max = axis.max;
		
	 // If we divide the scale up into exactly the requested number of parts, this is the interval we would get
		var exactGap = max / targetTickCount; 
		
	 /* Since we are displaying the values using abbreviations (eg 12kB not 12582912) we convert the exactGap value into 
	    an appropriate unit and then have a look at it. exactGapInUnits value will hold the exactGap in whatever units are 
	    appropriate (if the value is in the gigabyte range, it will be expressed in gigabytes)*/
		var exactGapUnits = Math.floor(Math.log(exactGap)/Math.log(K));
		var exactGapInUnits = exactGap / (Math.pow(K,exactGapUnits));
		
	 /* Now we need to find a value near to exactGapInUnits, but rounded acceptably. modValue is how much we subtract from 
	    the exact value to get the rounded value. */
		var modValue;
		if (exactGapInUnits < 1){
			modValue = 0;
		} else if (exactGapInUnits < 10){
			modValue = exactGapInUnits % 1;	
		} else {
			modValue = exactGapInUnits % 10;
		}
		
	 // This is how big the vertical scale interval will be, in the units we picked earlier
		roundedGap = exactGapInUnits - modValue;
		
	 // This is how big the vertical scale interval will be, in bytes
		roundedGap *= Math.floor(Math.pow(K,exactGapUnits));
		if (roundedGap == 0){
			roundedGap = 1;	
		}
		
	 // We need to return an array containing the scale values, so just keep adding roundedGap until we pass the graph maximum
		var ticks = [];
		var nextTick = 0;
		while (nextTick < max){
			ticks.push(nextTick);
			nextTick += roundedGap	
		}
		
		return ticks;
	};
});

$(document).ready(function(){
	 // Set up the event handlers for the tabs across the top of the screen
		$("#tabs").tabs({
				show: function(event, ui) {
					 // If there was a refresh timer active for the previous tab then clear it
						refreshTimer && clearInterval(refreshTimer);
						
						var tabIndex = ui.index;
						if (tabIndex === 0){
							tabShowMonitor();
						} else if (tabIndex === 1){
							tabShowHistory();
						} else if (tabIndex === 2){
							tabShowSummary();
						} else if (tabIndex === 3){
							tabShowQuery();
						} else if (tabIndex === 4){
							// About
						} else {
							assert(false, 'Bad tab index: ' + tabIndex);
						}
					},
				cookie: { expires: 30 }
			});

	 // Display the app version on the About screen
		$('#version').html(config.version);
		
	 // External links open new windows
		$("a[href^='http'], #donateForm").attr('target','_blank');

		$("noscript").hide(); // Needed for IE8
	});

