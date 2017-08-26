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
	var errorsList = '';
	var totalFiles;
	var fileIndex = 0;
	glob(opts.pathToResources + "/**/*.json", function(err, files) {
		totalFiles = files.length;
		files.forEach(function(fileToParse) {
			fs.readJSON(fileToParse, function(err, obj) {
				fileIndex++;
				//console.log('Working on file number ', fileIndex, ' path ', fileToParse);
				if(!obj) {
					console.log('!!!!!!!!!! Error reading file ', fileToParse);
					errorsList = errorsList + fileToParse + '\r\n';
				} else {
					_.each(obj.rlos, function(activity) {
						var resultPerActivity = [];
						recursivePassHolder(activity, resultPerActivity, function() {
							resultsArray.push(resultPerActivity);
						});
					});
				}

				if(fileIndex == totalFiles) {
					callback(resultsArray, errorsList);
				}	
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
	//console.log('recursive')
	if(typeof targetObject !== 'object') return;
	for(var i in targetObject) {
		i === "link" 
			&& targetObject[i].length > 0
			&& targetObject[i].indexOf('img/') < 0 
			&& targetObject[i].indexOf('http:') < 0 
			&& targetObject[i].indexOf('youtube.') < 0 
			&& targetObject[i].indexOf('youtu.') < 0 
			&& targetObject[i].indexOf('vimeo.') < 0 
			&& targetObject[i].indexOf('ted.') < 0 
			? resultsArray.push(targetObject[i]) : recursivePass(targetObject[i], resultsArray);
	}
}

/**
 * Holder for the recursive function to make sure we get the final parsed result
 * @param  {Object}   targetObject Target object that must be parsed
 * @param  {Array}    resultsArray Array thay will hold the result
 * @param  {Function} callback     Callback function to be cakked on the result of the recursive function
 */
function recursivePassHolder(targetObject, resultsArray, callback) {
	callback(recursivePass(targetObject, resultsArray));
}

/**
 * Works the array with the found resources into csv format and writes them to the destination file
 * @param  {Array} data Array of found links
 */
function writeToResultFile(data, errors) {
	console.log('########## Writing to result file ##########');
	data = _.flatten(data);
	var preparedData = data.map(function(element){
		return element.split('/').slice(-3).join(',');
	});

	preparedData = "Lesson UID,Activity UID,Resource UID\n" + preparedData.join('\n');
	fs.ensureFileSync(opts.resultPath);
	fs.writeFileSync(opts.resultPath, preparedData);

	var rawData = data.join('\n');
	//write the raw data resources paths
	var rawDataPath = path.join(path.dirname(opts.resultPath), 'rawData.txt');
	fs.ensureFileSync(rawDataPath);
	fs.writeFileSync(rawDataPath, rawData);

	//write the error log for jsons that could not be parsed
	var errorsPath = path.join(path.dirname(opts.resultPath), 'errors.log');
	fs.ensureFileSync(errorsPath);
	fs.writeFileSync(errorsPath, errors);
}

getLinksFromJSONs(writeToResultFile);