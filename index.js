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