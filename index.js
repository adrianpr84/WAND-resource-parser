var opts = require('nomnom')
	.options({
		pathToResources: {
			abbr: 'p',
			full: 'path-to-resources',
			required: 'true',
			help: 'Path to the folder containing the json files to be parsed'
		},
		resultPath: {
			abbr: 'r',
			full: 'result-path',
			required: 'true',
			help: 'Path to the file in which the result will pe placed'
		}
	}).parse();


//require
var path = require('path');
var fs = require('fs-extra');
var glob = require('glob');
var _ = require('underscore');

/**
 * Reads the target folder's json files, looks for the activities 
 * keys, get the resources for each activity and passes the found links to the callback function
 * @param  {Function} callback Callback function that handles the found links
 */
function getLinksFromJSONs(callback) {
	var resultsArray = [];
	glob(opts.pathToResources + "/*.json", function(err, files) {
		files.forEach(function(fileToParse) {
			fs.readJSON(fileToParse, function(err, obj) {
				_.each(obj.rlos, function(activity) {
					if(activity.resources) {
						_.each(activity.resources, function(resource) {
							recursivePass(resource, resultsArray);
						});
						callback(resultsArray);
					}
				});			
			});
		});		
	})	
}

/**
 * Parses the passed object and adds to the result array the links to uploaded resources
 * @param  {Object} targetObject The current item (not necceserally an object) that is investigated
 * @param  {Array} resultsArray  Array in which the desired links are added
 */
function recursivePass(targetObject, resultsArray) {
	if(typeof targetObject !== 'object') return;
	for(var i in targetObject) {
		i === "link" && targetObject[i].indexOf('img') < 0 && targetObject[i].indexOf('http') < 0 ? resultsArray.push(targetObject[i]) : recursivePass(targetObject[i], resultsArray);
	}
}

/**
 * Works the array with the found resources into csv format and writes them to the destination file
 * @param  {Array} data Array of found links
 */
function writeToResultFile(data) {
	var preparedData = data.map(function(element){
		return element.split('/').slice(-3).join(',');
	})
	preparedData = "Lesson UID,Activity UID,Resource UID\n" + preparedData.join('\n');
	fs.writeFileSync(opts.resultPath, preparedData);
}

getLinksFromJSONs(writeToResultFile);